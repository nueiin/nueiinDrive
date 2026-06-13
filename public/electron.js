const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { spawn, exec, ChildProcess } = require('child_process');
const path = require('node:path');

const log = require('electron-log');
const os = require('os');
const deviceHostName = os.hostname();

let win;
let rcloneMountProcess;
let rcloneSyncProcess;
var sync_process = new Array();
// let syncProcess;

var child_windows = new Array();
var child_windows_id = new Array();

function createWindow () {
    const { width, height } = require('electron').screen.getPrimaryDisplay().workAreaSize;
    const windowWidth = 420; // 창의 너비
    const windowHeight = 550; // 창의 높이

    win = new BrowserWindow({
        icon:path.join(__dirname, '/favicon.ico'),
        x: width - windowWidth,
        y: height - windowHeight,
        width: windowWidth, 
        height: windowHeight,
        movable: false,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false
        }
    })

    if (process.env.NODE_ENV) {
        win.loadURL('http://localhost:3000')
        // Open DevTools in development to diagnose blank window
        try { win.webContents.openDevTools({ mode: 'detach' }); } catch (e) {}
    } else {
        win.loadFile(`${path.join(__dirname, '/index.html')}`)
    }

    // Log load status to help debug blank screens
    win.webContents.on('did-finish-load', () => {
        log.info('Renderer finished load');
    });
    win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        log.error('Renderer failed to load', { errorCode, errorDescription, validatedURL });
    });
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        drive_unmount();
        app.quit()
    }
});

app.on('before-quit', () => {
    if (rcloneMountProcess) {
        drive_unmount();
    }
});

ipcMain.on('exec', async (event, data) => {
    log.info('\nexec ###############################');
    log.info(data);
    log.info('\n');
    switch (data.type) {
        case 'drive':
            if (data.active) {
                // 가상 드라이브 활성화
                drive_mount(data.user_idx, data.user_num, data.drive_name, data.drive_letter);
            } else {
                // 가상 드라이브 비활성화
                drive_unmount();
            }
            break;
        case 'sync':
            if (data.active) {
                // 동기화 활성화
                data.sync_folder.map(async (info) => {
                    if (info.is_active) {
                        await sync_active(info.fd_idx, info.rclone, info.mydrive, info.user);
                        await start_monitor(info.idx, info.fd_idx, info.rclone, info.user, info.mydrive);
                    }
                });
            } else {
                // 동기화 비활성화
                data.sync_folder.map(async (info) => {
                    await sync_inactive(info.idx);
                })
            }
            break;
        case 'shell':
            switch (data.action) {
                case 'openPath':
                    shell.openPath(`${data.drive_letter}:/`)
                    break;
                case 'disk':
                    get_logicaldisk();
                    break;
                case 'disk_free':
                    get_disk();
                    break;
            }
            break;
    }
});

ipcMain.on('sync', async (event, data) => {
    if (data.sync_folder) {
        await data.sync_folder.map(async (info) =>  {
            if (info.is_active) {
                await sync_proc(info.fd_idx, info.rclone, info.user, info.mydrive);
            } else {
                await sync_inactive(info.idx);
            }
        })
    }
});

ipcMain.on('NEW_WINDOW', (event, data) => {
    log.info("ipcMain NEW_WINDOW .......................");
    if (data.action === 'new_window') {
        make_new_window(data.id, data.size);
    }
})

// 가상드라이브
function drive_mount (user_idx, user_num, name, letter) { // 가상드라이브 활성화
    const rclonePath = path.join(__dirname, 'assets', 'rclone', 'rclone');
    var userfileDir = 'dev:/a/';
    if (user_num) {
        userfileDir += 'nueiin_' + user_num;
    } else {
        userfileDir += 'nueiin';
    }
    userfileDir += `/${user_idx}/mydrive`;
    const args = ['mount', userfileDir, `${letter}:`, '--volname', name, '--dir-cache-time', '1m'];
    log.info(args);
    rcloneMountProcess = spawn(rclonePath, args);

    setTimeout(() => {
        shell.openPath(`${letter}:`)
    }, 500);
}

function drive_unmount () { // 가상드라이브 비활성화
    if (rcloneMountProcess) {
        console.log('Sending SIGINT to rclone process...');
        rcloneMountProcess.kill('SIGINT');

        const timeout = setTimeout(() => {
            if (rcloneMountProcess) {
                console.log('rclone process did not exit in time, sending SIGKILL...');
                rcloneMountProcess.kill('SIGKILL');
            }
        }, 5000);

        rcloneMountProcess.on('exit', (code) => {
            clearTimeout(timeout);
            console.log(`rclone process exited with code ${code}`);
            rcloneMountProcess = null;
        });
    }
}

function get_logicaldisk () {
    
    const args = ['logicaldisk', 'get', 'name'];
    const data = spawn('wmic', args);
    data.stdout.on('data', (chunk) => {
        // chunk는 Buffer 또는 문자열일 수 있으므로 문자열로 변환하여 처리
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        const list = [];
        lines.forEach(line => {
            const diskName = line.trim().replace(':', ''); // 각 줄에서 디스크 이름을 얻어옴
            list.push(diskName);
        });

        const res = get_usable_letter(list);
        // 예를 들어 diskName이 'C:' 또는 'G:' 등의 형태일 때,
        const index = child_windows_id.indexOf('#Setting');
        if (index !== -1) {
            child_windows[index].webContents.send('disk', { disk: res });
        }
    });
      
    data.stderr.on('data', (res) => {
        log.info(`stderr: ${res}`);
    });
}

function get_disk () {
    const data = spawn('cmd.exe', ['/c', 'for %i in ("%cd%") do @echo %~di']);
    data.stdout.on('data', (chunk) => {
        log.info(`drive: ${chunk}`);
        const drive = chunk.toString().trim().replace(":", '');
        if (drive) {
            const index = child_windows_id.indexOf('#SyncSetting');
            if (index !== -1) {
                child_windows[index].webContents.send('disk_free', { letter: drive });
                get_drive_free(drive, index, '1GB');
            }
        }
    })
}

function get_drive_free (drive, index, unit) {
    const args = ['-NoProfile', '-Command', `(Get-PSDrive -Name ${drive}).Free / ${unit}`];
    const data = spawn('powershell', args);
    data.stdout.on('data', (chunk) => {
        var free = chunk.toString().trim().replace(/[^0-9.]/g, '');
        free = parseFloat(free).toFixed(1);
        if (unit === '1GB' && free < 1) {
            get_drive_free(drive, index, '1MB');
        } else {
            child_windows[index].webContents.send('disk_free', { free: free });
        }
    });
    data.stderr.on('data', (res) => {
        log.info(`stderr: ${res}`);
    });
}

function get_usable_letter(list) {
    const allDriveLetters = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)); // A부터 Z까지의 문자 배열 생성
    const availableDriveLetters = allDriveLetters.filter(letter => !list.includes(letter));

    if (availableDriveLetters.length > 0) {
        return availableDriveLetters; // 사용되지 않은 첫 번째 드라이브 문자 반환
    } else {
        return null; // 사용 가능한 드라이브 문자가 없을 경우 null 반환
    }
}

// 동기화
async function sync_active (fd_idx, rclone, mydrive, user) {
    /*
        동기화 초기 실행
        1) 앱 실행 시
        2) 동기화 설정 활성화 시
    */
    log.info('--------------- function [sync_active] ---------------');
    const rclonePath = path.join(__dirname, 'assets', 'rclone', 'rclone');

    const args = ['sync', rclone, user, '--dry-run', '--combined', '-'];
    const syncActive = spawn(rclonePath, args);

    const processFile = async (symbol, file) => {
        const info = await get_info_json(src, file);
        const size = info.size;
        const isDir = info.isDir;
        log.info(size);
        log.info(isDir);
        return new Promise((resolve, reject) => {
            let args;
            let type;

            switch (symbol) {
                case '=':
                    // same: nothing to do
                    return resolve();
                case '-':
                    // upload: copyto
                    log.info(`size: ${size}`);
                    if (Number(size) > 1000000000) { // 1G 용량 제한 (개인별 사용량 체크 추가 필요)
                        win.webContents.send('sync', { 
                            type: 'error',
                            isDir: isDir,
                            fd_idx: fd_idx, 
                            file_name: file, 
                            file_dir: mydrive, 
                            info: '100' 
                        });
                        return resolve();
                    } else {
                        args = ['copyto', `${user}/${file}`, `${rclone}/${file}`, '-P', '-M'];
                        type = 'UPLOAD';
                    }
                    break;
                case '+':
                    // download
                    args = ['copyto', `${rclone}/${file}`, `${user}/${file}`, '-P', '-M'];
                    type = 'DOWNLOAD';
                    break;
                case '*':
                    // different: dedupe
                    return resolve();
                case '!':
                    // error: nothing to do
                    return resolve();
                default:
                    return resolve();
            }

            const process = spawn(rclonePath, args);
            process.stdout.on("data", (chunk) => {
                const output = chunk.toString().split('\n').filter(line => line.trim().indexOf('*') !== -1);
                if (output) {
                    const match = output.toString().match(/(\d+)%/);
                    const percentage = match ? match[1] : '100';
                    win.webContents.send('sync', { 
                        type: type, 
                        isDir: isDir,
                        fd_idx: fd_idx,
                        file_name: file, 
                        file_dir: (type === 'UPLOAD' ? mydrive_dir : user_dir), 
                        info: percentage
                    });
                }
            });

            process.on("close", (code) => {
                if (code === 0) {
                    ipcMain.on('copy', (event, data) => {
                        if (data.status === 'true') {
                            resolve();
                        }
                    })
                } else {
                    reject(new Error(`Process exited with code ${code}`));
                }
            });
        });
    };

    for await (const chunk of syncActive.stdout) {
        const lines = chunk.toString().split('\n').filter(line => line.trim() != '');
        for (const line of lines) {
            const symbol = line.split(' ')[0];
            const file = line.split(' ')[1];
            try {
                await processFile(symbol, file);
            } catch (err) {
                log.error(`Failed to process file ${file}: ${err.message}`);
            }
        }
    }
}

async function start_monitor(idx, fd_idx, rclone, user, mydrive) {
    // 사용자 기기의 폴더 모니터링 시작
    try {
        const folderPath = user;

        // PowerShell 스크립트 실행 및 변수 전달
        const scriptPath = path.join(__dirname, 'monitor.ps1');
        log.info('PowerShell script: ', `${scriptPath}`);

        const process = spawn('powershell', [
            '-NoProfile',
            '-ExecutionPolicy', 'Bypass',
            '-File', scriptPath, folderPath
        ], {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        sync_process.push({idx: idx, process: process});
        process.stdout.setEncoding('utf8'); 
        process.stdout.on("data", async (chunk) => {
            // [!] 동기화 설정된 폴더가 여러개인 경우에도 모니터링 하는지 확인 필요
            await sync_proc(fd_idx, user, rclone, mydrive);
        });
        
    } catch (error) {
        log.info('Error in sync_active:', error);
    }
}
async function sync_proc(fd_idx, src, target, mydrive) {
    /*
        모니터링 중 변경 감지하여 동기화 실행
        1) 사용자 기기의 폴더에서 변경 감지
        2) 서버 폴더에서 변경 감지
    */
    log.info('--------------- function [sync_proc] ---------------');
    const rclonePath = path.join(__dirname, 'assets', 'rclone', 'rclone');

    // 1G 제한
    const args = ['sync', src, target, '--dry-run', '--combined', '-', '--log-level', 'ERROR'];
    rcloneSyncProcess = spawn(rclonePath, args);
    log.info(`rclone sync ${src} ${target} --dry-run --combined - --log-level ERROR`);
    const processFile = async (symbol, file) => {
        log.info(`${symbol} ${file}`);

        return new Promise(async (resolve, reject) => {
            let args;
            let type;

            switch (symbol) {
                case '-':
                    // delete(move): 휴지통으로 파일 이동, mydrive_folder_fildes => del_flg=1로 업데이트
                    var info = await get_info_json(target, file);
                    var size = info.size;
                    var isDir = info.isDir;
                    log.info(size);
                    log.info(isDir);
                    type = 'DELETE';
                    win.webContents.send('sync', { 
                        type: type, 
                        isDir: isDir,
                        fd_idx: fd_idx,
                        file_name: file, 
                        file_dir: mydrive, 
                        info: '100' 
                    });
                    break;
                case '+':
                    // upload: copyto
                    var info = await get_info_json(src, file);
                    var size = info.size;
                    var isDir = info.isDir;
                    log.info(size);
                    log.info(isDir);
                    if (Number(size) > 1000000000) { // 1G 용량 제한 (개인별 사용량 체크 추가 필요)
                        win.webContents.send('sync', { 
                            type: 'error',
                            isDir: isDir,
                            fd_idx: fd_idx, 
                            file_name: file, 
                            file_dir: mydrive, 
                            info: '100' 
                        });
                        return resolve();
                    } else {
                        args = ['copyto', `${src}/${file}`, `${target}/${file}`, '-P', '-M'];
                        type = 'UPLOAD';
                        log.info(`rclone copyto ${src}/${file} ${target}/${file} -P -M`);
                    }  
                    break;
                case '*':
                    // different: sync
                    // args = ['sync', `${src}/${file}`, target, '-P', '-M'];
                    // type = 'SYNC';
                    break;
                case '!':
                    // error: 에러 리스트 만들어줘야함
                    return resolve();
                default:
                    return resolve();
            }

            const process = spawn(rclonePath, args);
            var info = await get_info_json(target, file);
            var size = info.size;
            var isDir = info.isDir;
            log.info(size);
            log.info(isDir);
            process.stdout.on("data", (chunk) => {
                log.info(chunk);
                const output = chunk.toString().split('\n').filter(line => line.trim().indexOf('*') !== -1);
                if (output) {
                        const match = output.toString().match(/(\d+)%/);
                        const percentage = match && match[1] ? match[1] : null;
                        log.info(percentage + '%');
                    }
                switch (symbol) {
                    case '+':
                        if (output) {
                            const match = output.toString().match(/(\d+)%/);
                            const percentage = (match && match[1] ) ? match[1] : '100';
                            win.webContents.send('sync', { 
                                type: type, 
                                isDir: isDir,
                                fd_idx: fd_idx,
                                file_name: file, 
                                file_dir: mydrive, 
                                info: percentage 
                            });
                        }
                        break;
                    case '*':
                        if (output) {
                            const match = output.toString().match(/(\d+)%/);
                            const percentage = (match && match[1] ) ? match[1] : '100';
                            win.webContents.send('sync', { 
                                type: type, 
                                isDir: isDir,
                                fd_idx: fd_idx,
                                file_name: file, 
                                file_dir: mydrive, 
                                info: percentage 
                            });
                        }
                        break;

                }
            });

            process.on("close", (code) => {
                if (code === 0) {
                    ipcMain.on('copy', (event, data) => {
                        if (data.status === 'true') {
                            resolve();
                        }
                    })
                } else {
                    reject(new Error(`Process exited with code ${code}`));
                }
            });
        });
    };

    for await (const chunk of rcloneSyncProcess.stdout) {
        const lines = chunk.toString().split('\n').filter(line => line.trim() != '');
        for (const line of lines) {
            const symbol = line.split(' ')[0];
            const file = line.split(' ')[1];
            try {
                await processFile(symbol, file);
            } catch (err) {
                log.error(`Failed to process file ${file}: ${err.message}`);
            }
        }
    }
}

async function sync_inactive (idx) { // 동기화 비활성화
    if (rcloneSyncProcess) {
        console.log('Sending SIGINT to rclone process...');
        await rcloneSyncProcess.kill('SIGINT');
        rcloneSyncProcess = null;
    }
    if (sync_process.length > 0) {
        if (idx) {
            var p_idx = sync_process.findIndex((p) => p.idx === idx);
            sync_process[p_idx].process.kill('SIGINT');
            sync_process.splice(p_idx, 1);
        } else {
            sync_process.map((p) => {
                p.process.kill('SIGINT');
                p.splice(p_idx, 1);
            });
        }

    }

}

async function get_info_json (src, file) {
    return new Promise((resolve, reject) => {
        // rclone 명령어와 인수 설정
        const rclonePath = path.join(__dirname, 'assets', 'rclone', 'rclone');
        const process = spawn(rclonePath, ['lsjson', `${src}/${file}`]);
        log.info(`rclone lsjson ${src}/${file}`);

        // 출력 데이터를 저장할 변수
        let outputData = '';
        let errorOutput = '';

        // 표준 출력(stdout) 데이터를 수집
        process.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        // 표준 오류(stderr) 데이터를 수집
        process.stderr.on('data', (data) => {
            errorOutput += data.toString();
            log.error(`stderr: ${data}`);
        });

        // 프로세스 종료 시 호출
        process.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Process exited with code ${code}: ${errorOutput}`));
                return;
            }

            try {
                const jsonOutput = JSON.parse(outputData);
                const size = jsonOutput[0].Size;  // Assuming it's an array of files/directories
                const isDir = jsonOutput[0].IsDir; // Ensure the case is correct
                resolve({ size: size, isDir: isDir });
            } catch (err) {
                reject(new Error(`Failed to parse JSON output: ${err.message}`));
            }
        });
    });
}

function make_new_window(data, size) {
    log.info("ipcMain make_new_window");
    log.info(data);
    var window_id = data;
    
    // 우선 같은 id로 떠있는 chat room 이 있는지 확인하고 있으면 show만 해주면 된다.
    if (child_windows.length > 0 && child_windows_id.indexOf(window_id) !== -1) {
        const index = child_windows_id.indexOf(window_id);
        // child_windows[index].reload();
        child_windows[index].show();
    } else {
        var minWidth = 400;
        var minHeight = 600;
        var width = 500;
        var height = 600;

        if (data.indexOf('#Setting') !== -1) {
            minWidth = 600;
            width = 600;
        } 
        // 창크기 저장된 값이 있으면 해당 값으로 width, height 지정
        if (size && size.width && size.height) {
            width = parseInt(size.width);
            height = parseInt(size.height);
        }
        const child = new BrowserWindow({
            icon:path.join(__dirname, '/favicon.ico'),
            minWidth: minWidth,
            minHeight: minHeight,
            width: width,
            height: height,
            webPreferences: {
                nodeIntegration: true,
                enableRemoteModule: true,
                contextIsolation: false
            }
        });
        if (!process.env.NODE_ENV) {
            child.setMenu(null);
        }
        child.on("close", e => {
            const index = child_windows_id.indexOf(window_id);
            child_windows_id.splice(index, 1);
            child_windows.splice(index, 1);
        });
        
        if (process.env.NODE_ENV) {
            child.loadURL('http://localhost:3000/' + data);
        } else {
            const url = 'file://' + path.join(__dirname, '../build/index.html') + data;
            child.loadURL(url);
        }
        child.show();
        child_windows_id.push(window_id);
        child_windows.push(child);
    }
}