import React, { useState, useEffect, useContext } from "react";
import styled, { ThemeContext } from "styled-components";
import axios from 'axios';
import nueiinConfig from "../nueiin.json";
import { VirtualDriveStatusContext, SyncStatusContext } from "../contexts";
import "../i18n.config";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { fetchLog, fetchSettings } from "../api";
// import { SyncLog } from "../components";
import { DateTime, Duration } from "luxon";
import { IoTrashSharp, IoCloud } from "react-icons/io5";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleUser } from '@fortawesome/free-solid-svg-icons';
import { upload } from "@testing-library/user-event/dist/upload";

const Container = styled.div`
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #fff;
`;
const UserInfoBox = styled.div`
    position: fixed;
    display: flex;
    column-gap: 10px;
    align-items: center;
    width: 100%;
    top: 0;
    height: 55px;
    padding: 15px 20px;
    z-index: 100;
    background-color: #fff;
    border: 1px solid ${props => props.theme.borderColor};
    font-size: ${props => props.theme.defaultFontSize};
`;
const UserProfileImageBox = styled.div`
    display: flex;
    padding: 0px;
    align-items: center;
    margin-top: 5px;
`;
const UserName = styled.div`
    font-size: ${props => props.theme.bigFontSize};
    font-weight: 600;
`;
const SyncLogList = styled.div`
    margin-top: 90px;
    height: calc(100vh - 165px);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    padding: 10px;
    row-gap: 10px;
`;
const SyncLogWrapper = styled.div`
    display:flex;
    background-color: #fff;
    padding: 5px 10px;
    font-size: ${props => props.theme.defaultFontSize};
`;
const BottomMenu = styled.div`
    position: fixed;
    display: flex;
    width: 100%;
    bottom: 0;
    height: 50px;
    z-index: 100;
    background-color: #fff;
    border: 1px solid ${props => props.theme.borderColor};
    justify-content:space-around;

    div {
        &:hover {
            cursor: pointer;
        }
    }
`;

interface logType {
    date: string,
    path: string,
    event: string,
    f_name: string,
    f_type: string,
    f_detail_type: string
}
const Main: React.FC = () => {
    const { ipcRenderer } = window.require('electron');
    const { isSyncActive, setIsSyncActive, sync } = useContext(SyncStatusContext);
    const { isVirtualDriveActive, virtualDrive } = useContext(VirtualDriveStatusContext);
    const { t } = useTranslation();
    const loginUser = { userIdx:702, userNum: null, deviceName: 'Windows_DESKTOP-53QA2LB' };
    const [syncFolder, setSyncFolder] = useState<{idx:Number, fd_idx:Number, rclone:String, mydrive:String, user:String, is_active:boolean}[]>([]);
    const [syncData, setSyncData] = useState<{event?:string, isDir?:Boolean, fd_idx?:string, file_dir?:string, file_name?:string, info?:string}>({});
    const [now, setNow] = useState<DateTime>(DateTime.now().setZone('Asia/Seoul'));
    const [log ,setLog] = useState<logType[]>([]);
    const theme = useContext(ThemeContext);
    const [userInfo, setUserInfo] = useState<{ name: string; dept: string; position: string }>({ name: '', dept: '', position: '' });
    
    const { data:content } = useQuery<logType[]>({
        queryKey: ['content'],
        queryFn: fetchLog,
        refetchInterval: 1000, // 1초마다 데이터 업데이트 (밀리초 단위)
    });

    useEffect(() => {
        ipcRenderer.on('sync', (event?:any, arg?:any) => {
            setSyncData({
                event: arg.type,
                isDir: arg.isDir,
                fd_idx: arg.fd_idx,
                file_dir: arg.file_dir,
                file_name: arg.file_name,
                info: arg.info,
            });
        });
        
        get_user_info();
        get_settings();

        return (() => {
            sync.stop();
        })
    }, []);

    
    useEffect(() => {
        const interval = setInterval(() => {
            setNow(DateTime.now().setZone('Asia/Seoul'));
        }, 1000);

        return () => clearInterval(interval);
    }, [])

    useEffect(() => {
        if (isSyncActive) {
            syncFolder.map(() => {
                ipcRenderer.send('sync', {
                    sync_folder: syncFolder
                });
            })
        }
        if (content && content.length > 0) {
            setLog(prev => {
                return ([...content,...prev])
            });
        }
    }, [content])

    useEffect(() => {
        console.log(isSyncActive);
        if (isSyncActive) {
            if (syncFolder.length > 0) {
                watch_userfile();
            }
        } else {
            if (syncFolder.length > 0) {
                stop_watch();
            }
        }
    }, [isSyncActive]);

    useEffect(() => {
        console.log(syncData);
        if (syncData.info && syncData.info === '100') {
            const now = DateTime.now().setZone('Asia/Seoul').toFormat("yyyyMMddHHmmss");
            write_log(now, syncData);
        }
    }, [syncData]);

    const showSetting = () => {
        ipcRenderer.send('NEW_WINDOW', {
            action: 'new_window',
            id: '#Setting'
        });
    }

    const getTimeDiff = (now:DateTime, date:string) => {
        const logTime = DateTime.fromFormat(date, "yyyyMMddHHmmss");
        const diff = now.diff(logTime, ['hours', 'minutes']);

        const days = Math.floor(diff.as('days'));
        const hours = Math.floor(diff.as('hours') % 24);
        const minutes = Math.floor(diff.as('minutes') % 60);
    
        let text = '';
        
        if (days > 0) {
            text = `${days}일`;
        } else if (hours > 0) {
            text = `${hours}시간 `;
        } else if (minutes > 1) {
            text = `${minutes}분`;
        } else {
            text = '조금';
        }

        text += ' 전';
        return text;
    }
    
    const exec_command = (
        {
            type,
            active,
            action,
            drive_name,
            drive_letter,
            mydrive_dir,
            user_dir,
            sync_folder
        }:{
            type:any,
            active?: boolean,
            action?: string,
            drive_name?: string,
            drive_letter?: string,
            mydrive_dir?: string,
            user_dir?: string,
            sync_folder?: {idx:Number, mydrive:String, user:String, is_active:boolean}[]
        }) => {
        ipcRenderer.send('exec', {
            user_idx: loginUser.userIdx,
            user_num: loginUser.userNum,
            type:type,
            active:active,
            action:action,
            drive_name: drive_name,
            drive_letter: drive_letter,
            mydrive_dir: mydrive_dir,
            user_dir: user_dir,
            sync_folder: sync_folder
        });
    }

    const FileIcon = (f_type: any, f_detail_type: any) => {
        switch (f_type) {
            case '1':
                // 오피스
                switch (f_detail_type) {
                    case '11':
                        // 엑셀
                        return <img src={process.env.PUBLIC_URL + '/assets/icons/file_excel.svg'} width={24} height={24} />;
                    case '12':
                        // ppt
                        return <img src={process.env.PUBLIC_URL + '/assets/icons/file_ppt.svg'} width={24} height={24} />;
                    case '13':
                        // pdf
                        return <img src={process.env.PUBLIC_URL + '/assets/icons/file_pdf.svg'} width={24} height={24} />;
                    case '14':
                        // hwp
                        return <img src={process.env.PUBLIC_URL + '/assets/icons/file_hwp.svg'} width={24} height={24} />;
                    case '15':
                        // word
                        return <img src={process.env.PUBLIC_URL + '/assets/icons/file_word.svg'} width={24} height={24} />;
                    default:
                        return <img src={process.env.PUBLIC_URL + '/assets/icons/file_doc.svg'} width={24} height={24} />;
                }
            case '3':
                // 동영상
                return <img src={process.env.PUBLIC_URL + '/assets/icons/file_video.svg'} width={24} height={24} />;
            case '4':
                // 음악
                return <img src={process.env.PUBLIC_URL + '/assets/icons/file_music.svg'} width={24} height={24} />;
            case '5':
                // 압축파일
                return <img src={process.env.PUBLIC_URL + '/assets/icons/file_zip.svg'} width={24} height={24} />;
            default:
                // txt (2:image 는 [#IMAGE#] 로 들어감)
                return <img src={process.env.PUBLIC_URL + '/assets/icons/file_doc.svg'} width={24} height={24} />;
        }
    }

    const get_user_info = async () => {
        try {
            const response = await axios
                .post(`${nueiinConfig.nueiinServer}/user/get_user_info`, {
                    user_idx: loginUser.userIdx,
                    user_num: loginUser.userNum
                }, { withCredentials: true });
            
            if (!response.data.status) {
                console.log('error');
                return;
            }

            setUserInfo(response.data.userInfo);
        } catch (e) {
            setUserInfo({name: '홍길동', position: '사원', dept: '연구소'});
            console.log("Connection Failed " + e);
        } finally {
        }
    }

    const get_settings = async (info?:any) => {
        try {
            const response = await axios
                .post(`${nueiinConfig.nueiinServer}/setting/get_settings`, {
                    user_idx: loginUser.userIdx,
                    user_num: loginUser.userNum,
                    device_name: loginUser.deviceName
                }, { withCredentials: true });

            if (!response.data.status) {
                console.log('error');
                return;
            }

            const { sync, virtual_drive } = response.data;

            // sync
            if (sync?.is_active === "1") setSyncFolder(sync.sync_folder);

            // virtual_drive
            if (virtual_drive?.is_active === "0") {
                virtualDrive.stop();
            } else if (virtual_drive?.is_active === "1") {
                virtualDrive.start();
            }
        } catch (e) {
            console.log("Connection Failed " + e);
        }
    }

    const watch_userfile = async () => {
        try {
            const response = await axios
                .post(`${nueiinConfig.nueiinServer}/sync/watch_userfile`, {
                    user_idx: loginUser.userIdx,
                    user_num: loginUser.userNum
                }, { withCredentials: true });

            if (!response.data.status) {
                console.log('error');
                return;
            }
        } catch (e) {
            console.log("Connection Failed " + e);
        } finally {
            exec_command({type:'sync', active: true, sync_folder: syncFolder});
        }
    }

    const stop_watch = async (info?:any) => {
        try {
            const response = await axios
                .post(`${nueiinConfig.nueiinServer}/sync/stop_watch`, {
                    user_idx: loginUser.userIdx,
                    user_num: loginUser.userNum,
                }, { withCredentials: true });
            
            if (!response.data.status) {
                console.log('error');
                return;
            }
        } catch (e) {
            console.log("Connection Failed " + e);
        } finally {
            exec_command({type:'sync', active: false});
        }
    }

    const write_log = async (now: string, syncData:any) => {
        try {
            const response = await axios
                .post(`${nueiinConfig.nueiinServer}/sync/write_log`, {
                    user_idx: loginUser.userIdx,
                    user_num: loginUser.userNum,
                    datetime: now,
                    event: syncData.event,
                    isDir: syncData.isDir,
                    fd_idx: syncData.fd_idx,
                    file_dir: syncData.file_dir,
                    file_name: syncData.file_name,
                }, {withCredentials: true});
            
            if (!response.data.status) {
                console.log('error');
                return;
            }
        } catch (e) {
            console.log("Connection Failed " + e);
        } finally {
            ipcRenderer.send('copy', {
                status: 'true'
            });
        }
    }

    return (
        <Container>
            <UserInfoBox>
                <UserProfileImageBox>
                    <FontAwesomeIcon icon={faCircleUser} style={{color: theme?.iconColor, width:36, height:36}} />
                </UserProfileImageBox>
                <UserName>{userInfo.name}</UserName>
                <div>{`${userInfo.position} | ${userInfo.dept}`}</div>
            </UserInfoBox>
            <SyncLogList>
                {syncData.file_name && 
                        <SyncLogWrapper>
                            <div>{syncData.file_name}</div>
                            {
                                syncData.info === '100' &&
                                <div>동기화 완료</div>
                            }
                            {
                                syncData.info && syncData.info !== '100' &&
                                <div>{syncData.info+'%'}</div>
                            }
                        </SyncLogWrapper>
                }
                {now && log!.map((l:logType, index:any) => (
                    l.f_name &&
                    <SyncLogWrapper key={index}>
                        <div className="flex" style={{alignItems:'center', justifyContent:'center', marginRight:10}}>
                            <FileIcon f_type={l.f_type} f_detail_type={l.f_detail_type} />
                        </div>
                        <div>
                            <label>{l.f_name}</label>
                            <div>
                                <span>{l.event}</span>
                                <span> - </span>
                                <span>{now && getTimeDiff(now, l.date) !== undefined ? `${getTimeDiff(now, l.date)}` : 'Calculating...'}</span>
                            </div>
                        </div>
                    </SyncLogWrapper>
                ))}
                {
                    log?.length === 0 &&
                    <SyncLogWrapper style={{alignItems:'center', justifyContent:'center', flex:1, flexDirection:'column', color:theme?.greyText}}>
                        {React.createElement(IoCloud as any, {size: 120, color: '#D2B5F9'})}
                        최신 상태입니다.
                    </SyncLogWrapper>
                }
            </SyncLogList>
            <BottomMenu>
                <div onClick={()=>{}} style={{display:'flex', alignItems:'center', right:0}}><img src={process.env.PUBLIC_URL + '/assets/icons/inventory.svg'} style={{width:32, height:32}}/></div>
                <div onClick={()=>{}} style={{display:'flex', alignItems:'center', right:0}}>
                {React.createElement(IoTrashSharp as any, {size: 32, color: theme?.iconColor})}</div>
                <div onClick={showSetting} style={{display:'flex', alignItems:'center', right:0}}><img src={process.env.PUBLIC_URL + '/assets/icons/setting_off.svg'} style={{width:32, height:32}}/></div>
            </BottomMenu>
        </Container>
    );
};

export default Main;
