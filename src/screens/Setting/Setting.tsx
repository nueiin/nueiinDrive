import React, { useState, useEffect, useContext } from "react";
import styled, { ThemeContext } from "styled-components";
import axios from 'axios';
import nueiinConfig from "../../nueiin.json"
import { VirtualDriveStatusContext, SyncStatusContext } from "../../contexts";
import "../../i18n.config";
import { useTranslation } from "react-i18next";
import ReactModal from "react-modal";
import { AiOutlineClose, AiOutlinePlus, AiOutlineSync, AiOutlinePause, AiFillCaretRight } from 'react-icons/ai';
import Switch from "react-switch";
import { useQuery } from "@tanstack/react-query";
import { fetchSettings } from "../../api";
import "../../Style.css";

const Container = styled.div`
    position: fixed;
    inset: 0px;
    background: #fff;
`;
const TitleBox = styled.div`
    position:absolute;
    top:0px;
    width: 100vw;
    height: 50px;
    padding: 5px 10px;
`;
const Wrapper = styled.div`
    position:absolute;
    left:150px;
    top:50px;
    width:calc(100vw - 180px);
    height:100vh;
    border-top: 1px solid ${props => props.theme.borderColor};
    display:flex;
    flex-direction: column;
    padding: 15px;
    overflow:auto;
    font-size:${props => props.theme.defaultFontSize};
`;
const SwitchWrapper = styled.div`
    display:flex;
    column-gap:10px;
    margin-bottom:10px;
`;
const SwitchLabel = styled.div`
    font-size:${props => props.theme.bigFontSize};
    font-weight:600;

`;
const StyledButton = styled.div`
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:${props => props.theme.btnFontSize};
    column-gap:5px;
    padding:10px;
    margin-top:10px;
    border-radius:10px;
    border-width:1px;
    border-style:solid;
    border-color:${props => props.theme.placeholderColor};
    color:${props => props.theme.greyText};
    background-color:${props => props.theme.background};
    cursor:pointer;
`;
const OptionWrapper = styled.div`
    margin-top:10px;
    display:flex;
    column-gap:10px;
`;
const MenuBody = styled.div`
    position:absolute;
    top:50px;
    z-index:100;
    width: 150px;
    height:100vh;
    overflow-y:auto;
    border: 1px solid ${props => props.theme.borderColor};
`;

const SyncFolderBox = styled.div`
    display:flex;
    flex:1;
    align-items:center;
    justify-content:space-around;
    padding: 5px;
    border: 1px solid ${props => props.theme.borderColor};
    margin-bottom: 10px;
    height: 50px;
    padding:5px 20px;
    label {
        width:70px;
    }
`;
const SyncFolderInfo = styled.div`
    display:flex;
    height: 35px;
    align-items:center;
    flex:1;
    padding:0px 15px;
    &:hover .hidden {
        position:absolute;
        display:flex;
        width: calc(100vw - 280px);
        height:40px;
        align-items:center;
        justify-content:center;
        background-color: ${props => props.theme.background};
        opacity:0.8;
        cursor:pointer;
    }
`;
const MenuBox = styled.div`
    display:flex;
    flex-direction:column;
    background-color: ${props => props.theme.background};
    margin-bottom:10px;
`;
const MenuBoxTabTitle = styled.div`
`;
const MenuBoxTab = styled.div`
    display:flex;
    flex-direction:column;
    justify-content:space-between;
`;
const MenuBoxTabTextWrap = styled.div<MenuBoxTabTextProps>`
    cursor:pointer;
    flex:1;
    padding:15px 10px;
    background: ${props => props.isActive ? props.theme.greyBackground : 'transparent'};
    font-weight:${props => props.isActive ? '600' : 'normal'};
`;
interface MenuBoxTabTextProps {
    isActive: boolean;
}
const MenuBoxTabText = styled.span`
    font-size:${props => props.theme.defaultFontSize};
    color: ${props => props.theme.text};
    padding-bottom:8px;
    padding-left:10px;
    padding-right:10px;
`;
const MenuBoxTabBody = styled.div`
    padding:15px 0px;
`;
const TitleText = styled.div`
    padding:10px;
    font-size:${props => props.theme.bigFontSize};
    font-weight:600;
    color:${props => props.theme.text};
    display:flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom:5px;
`;
const ModalBody = styled.div`
    padding:5px 10px;
    color: ${props => props.theme.greyText};
    font-size: ${props => props.theme.defaultFontSize};
`;
const ModalBottom = styled.div`
    display:flex;
    column-gap:10px;
    justify-content: flex-end;
    align-items: center;
    margin-top: 20px;
`;

interface VirtualDriveInfoType {
    drive_name: string;
    drive_letter: string;
    is_active: number;
}

interface syncFolderType {
    idx: number, 
    fd_idx: number, 
    fd_name:string,
    rclone:string, 
    mydrive:string, 
    user:string, 
    is_active: string
}
const Setting: React.FC = () => {
    const { ipcRenderer } = window.require('electron');

    const loginUser = { userIdx: 702, userNum: null, deviceName: 'Windows_DESKTOP-53QA2LB' };
    const { isSyncActive, setIsSyncActive, sync } = useContext(SyncStatusContext);
    const { isVirtualDriveActive, virtualDrive } = useContext(VirtualDriveStatusContext);
    const { t } = useTranslation();
    const theme = useContext(ThemeContext);

    const [isGeneralMenu, setIsGeneralMenu] = useState<boolean>(true);
    const [isVirtualDriveMenu, setIsVirtualDriveMenu] = useState<boolean>(false);
    const [isSyncMenu, setIsSyncMenu] = useState<boolean>(false);
    
    const [virtualDriveInfo, setVirtualDriveInfo] = useState<VirtualDriveInfoType>({
        drive_name: '',
        drive_letter: '',
        is_active: 0
    });

    const [driveModalVisible, setDriveModalVisible] = useState<boolean>(false);
    const [diskLetters, setDiskLetters] = useState<Array<string>>([]);
    const [selectedDrive, setSelectedDrive] = useState<string>('');
    const [driveName, setDriveName] = useState<string>('');
    const [mydriveDir, setMydriveDir] = useState<{fd_name:string, fd_idx?:Number}>({fd_name:'', fd_idx:undefined});
    const [userDir, setUserDir] = useState<string>('');
    const [syncModalVisible, setSyncModalVisible] = useState<boolean>(false);
    const [syncFolder, setSyncFolder] = useState<syncFolderType[]>([]);

    useEffect(() => {
        console.log('get_settings');
        get_settings();
    }, [])

    useEffect(() => {
        if (isVirtualDriveMenu) {
            get_virtual_drive();
            ipcRenderer.on('disk', (event: any, arg: any) => {
                setDiskLetters(arg.disk);
            });
        }
    }, [isVirtualDriveMenu]);

    const exec_command = (
        {
            type,
            active,
            action,
            drive_name,
            drive_letter,
            sync_folder
        }:{
            type:any,
            active?: boolean,
            action?: String,
            drive_name?: String,
            drive_letter?: String,
            sync_folder?: syncFolderType[]
        }) => {
        ipcRenderer.send('exec', {
            user_idx: loginUser.userIdx,
            user_num: loginUser.userNum,
            type:type,
            active:active,
            action:action,
            drive_name: drive_name,
            drive_letter: drive_letter,
            sync_folder: sync_folder
        });
    }

    const changeMenu = (num: number) => {
        switch (num) {
            case 1 :
                setIsGeneralMenu(true);
                setIsVirtualDriveMenu(false);
                setIsSyncMenu(false);
                break;
            case 2 : 
                setIsGeneralMenu(false);
                setIsVirtualDriveMenu(true);
                setIsSyncMenu(false);
                break;
            case 3 : 
                setIsGeneralMenu(false);
                setIsVirtualDriveMenu(false);
                setIsSyncMenu(true);
                break;
          }
    };

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

            if (sync?.is_active === "0") {
                sync.stop();
            } else if (sync?.is_active === "1") {
                sync.start();
            }

            if (virtual_drive?.is_active === "0") {
                virtualDrive.stop();
            } else if (virtual_drive?.is_active === "1") {
                virtualDrive.start();
            }

            setSyncFolder(sync.sync_folder);
        } catch (e) {
            console.log("Connection Failed " + e);
        }
    }

    /* 가상드라이브 */
    const exec_virtual_drive = () => {
        exec_command({
            type:'drive',
            active: true,
            drive_name: virtualDriveInfo.drive_name,
            drive_letter: virtualDriveInfo.drive_letter
        });
        virtualDrive.start();
    }

    const stop_virtual_drive = () => {
        exec_command({type:'drive', active: false});
        virtualDrive.stop();
    }

    const get_virtual_drive = async () => {
        try {
            const response = await axios
                .post(`${nueiinConfig.nueiinServer}/setting/get_virtual_drive`, {
                    user_idx: loginUser.userIdx,
                    user_num: loginUser.userNum,
                    device_name: loginUser.deviceName,
                }, { withCredentials: true });

            if (!response.data.status) {
                console.log('error');
                return;
            }

            setVirtualDriveInfo({
                drive_name: response.data.drive_name,
                drive_letter: response.data.drive_letter,
                is_active: response.data.is_actice
            });
            setDriveName(response.data.drive_name);
            setSelectedDrive(response.data.drive_letter);
        } catch (e) {
            console.log("Connection Failed " + e);
        }
    }

    const set_virtual_drive = async () => {
        var is_active = isVirtualDriveActive ? 1 : 0;
        try {
            const response = await axios
                .post(`${nueiinConfig.nueiinServer}/setting/set_virtual_drive`, {
                    user_idx: loginUser.userIdx,
                    user_num: loginUser.userNum,
                    device_name: loginUser.deviceName,
                    drive_name: driveName,
                    drive_letter: selectedDrive,
                    is_active: is_active
                }, { withCredentials: true });

            if (!response.data.status) {
                console.log('error');
                return;
            }

            get_virtual_drive();
            close_drive_modal();
        } catch (e) {
            console.log("Connection Failed " + e);
        }
    }

    const open_virtual_drive = () => {
        exec_command({ type:'shell', action: 'openPath', drive_letter: virtualDriveInfo.drive_letter })
    }

    const open_virtual_drive_setting = () => {
        setDriveModalVisible(true);
        ipcRenderer.send('exec', { type: 'shell', action: 'disk' });
    }

    const close_drive_modal = () => {
        setDriveName('');
        setDriveModalVisible(false);
    }

    /* 동기화 */
    const exec_sync = async () => {
        setIsSyncActive(!isSyncActive);
        // sync.start();
    }

    const stop_sync = async () => {
        setIsSyncActive(!isSyncActive);
        // sync.stop();
    }

    console.log(isSyncActive.toString());

    const open_sync_modal = () => {
        setSyncModalVisible(true);
    }

    const close_sync_modal = () => {
        setUserDir('');
        setMydriveDir({fd_name:'', fd_idx:undefined});
        setSyncModalVisible(false);
    }

    const exec_sync_folder = async (idx:number) => {
        // 폴더 동기화 활성화
        try {
            const response = await axios
                .post(`${nueiinConfig.nueiinServer}/sync/watch_userfile`, {
                    user_idx: loginUser.userIdx,
                    user_num: loginUser.userNum,
                    idx: idx
                }, { withCredentials: true });

            if (!response.data.status) {
                console.log('error');
                return;
            }

            exec_command({type:'sync', active: true, sync_folder: syncFolder});
        } catch (e) {
            console.log("Connection Failed " + e);
        } 
    }

    const stop_sync_folder = async (idx:number) => {
        // 폴더 동기화 비활성화
        // info: 특정 프로세스에 대한 정보만 array로 담아주자
        try {
            const response = await axios
                .post(`${nueiinConfig.nueiinServer}/sync/stop_watch`, {
                    user_idx: loginUser.userIdx,
                    user_num: loginUser.userNum,
                    idx: idx
                }, { withCredentials: true });

            if (!response.data.status) {
                console.log('error');
                return;
            }
        } catch (e) {
            console.log("Connection Failed " + e);
        } finally {
            ipcRenderer.send('sync', {
                sync_folder: syncFolder
            });
        }
    }

    const add_sync_folder = async () => {
        // 빈 문자열 체크 필요
        try {
            const response = await axios
                .post(`${nueiinConfig.nueiinServer}/setting/add_sync_folder`, {
                    user_idx: loginUser.userIdx,
                    user_num: loginUser.userNum,
                    device_dir: userDir,
                    fd_idx: mydriveDir.fd_idx
                }, { withCredentials: true });
            if (!response.data.status) {
                console.log('error');
                return;
            }
        } catch (e) {
            console.log("Connection Failed " + e);
        } finally {
            close_sync_modal();
        }
    }

    const showSyncSetting = () => {
        ipcRenderer.send('NEW_WINDOW', {
            action: 'new_window',
            id: '#SyncSetting'
        });
    }

    return (
        <Container>
            <TitleBox>
                <TitleText>{t('Setting')}</TitleText>
            </TitleBox>
                <MenuBody>
                    <MenuBox>
                        <MenuBoxTabTitle>
                            <MenuBoxTab>
                                <MenuBoxTabTextWrap isActive={isGeneralMenu} onClick={()=>changeMenu(1)}><MenuBoxTabText>{t('General')}</MenuBoxTabText></MenuBoxTabTextWrap>
                                <MenuBoxTabTextWrap isActive={isVirtualDriveMenu} onClick={()=>changeMenu(2)}><MenuBoxTabText>{t('VirtualDriveSetting')}</MenuBoxTabText></MenuBoxTabTextWrap>
                                <MenuBoxTabTextWrap isActive={isSyncMenu} onClick={()=>changeMenu(3)}><MenuBoxTabText>{t('SyncSetting')}</MenuBoxTabText></MenuBoxTabTextWrap>
                            </MenuBoxTab>
                        </MenuBoxTabTitle>
                    </MenuBox>
                </MenuBody>
            <Wrapper>
                {
                    isVirtualDriveMenu &&
                    <div>
                        <SwitchWrapper>
                            <Switch
                                checked={isVirtualDriveActive}
                                onChange={isVirtualDriveActive ? stop_virtual_drive : exec_virtual_drive}
                                onColor={theme?.pointColor}
                                uncheckedIcon={false}
                                checkedIcon={false}
                                boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                                activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
                                height={20}
                                width={36} 
                            />
                            <SwitchLabel className={"title"}>{t('EnableVirtualDrive')}</SwitchLabel >
                        </SwitchWrapper>
                        <div>
                            가상 드라이브를 통해 MYDRIVE 파일 및 폴더에 바로 접근할 수 있습니다.
                            가상 드라이브는 별도 동기화 설정이 필요없어 편리하며 내 컴퓨터의 공간을 차지하지 않습니다.
                        </div>
                        <OptionWrapper>
                            <input value={virtualDriveInfo.drive_name} />
                            <button className="btn" onClick={open_virtual_drive}>{t('Open')}</button>
                            <button className="btn" onClick={open_virtual_drive_setting}>{t('Setting')}</button>
                        </OptionWrapper>
                    </div>
                }
                {
                    isSyncMenu &&
                    <div>
                        <SwitchWrapper>
                            <Switch
                                checked={isSyncActive}
                                onChange={isSyncActive ? stop_sync : exec_sync}
                                onColor={theme?.pointColor}
                                uncheckedIcon={false}
                                checkedIcon={false}
                                boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                                activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
                                height={20}
                                width={36} 
                            />
                            <SwitchLabel  className={"title"}>{t('EnableFolderSync')}</SwitchLabel >
                        </SwitchWrapper>
                        <div>
                            내 컴퓨터 기기에 저장된 폴더와 MYDRIVE의 폴더를 1:1로 연결한 뒤 병합하여 서로 동일한 상태로 유지합니다.
                            동기화된 파일은 내 컴퓨터 드라이브 공간을 차지하여 오프라인에서 사용할 수 있습니다.
                        </div>
                        <div className="mt-10">
                        {
                            syncFolder && syncFolder.map((folder) => {
                                return (
                                    <SyncFolderBox>
                                        <div>{React.createElement(AiOutlineSync as any, {color: theme?.greyText, size: 18})}</div>
                                        <SyncFolderInfo>
                                            <div>
                                                <div className="flex">
                                                    <label>내 컴퓨터</label> 
                                                    <div>{folder.user}</div>
                                                </div>
                                                <div className="flex">
                                                    <label>MYDRIVE</label>
                                                    <div>
                                                        {Number(folder.fd_idx) === 0 && t(folder.fd_name)}
                                                        {Number(folder.fd_idx) !== 0 && folder.fd_name}
                                                    </div>
                                                </div>
                                            </div>
                                            {
                                                folder.is_active === '0' &&
                                                <div className="hidden" onClick={()=>exec_sync_folder(folder.idx)}>
                                                    {React.createElement(AiFillCaretRight as any, {color: theme?.greyText, size: 22})}
                                                </div>
                                            }
                                            {
                                                folder.is_active !== '0' &&
                                                <div className="hidden" onClick={()=>stop_sync_folder(folder.idx)}>
                                                    {React.createElement(AiOutlinePause as any, {color: theme?.greyText, size: 22})}
                                                </div>
                                            }
                                        </SyncFolderInfo>
                                        <div>{React.createElement(AiOutlineClose as any, {color: theme?.greyText, size: 18, style: { color: theme?.greyText, cursor: "pointer" }})}</div>
                                    </SyncFolderBox>
                                )
                            })
                        }
                        </div>
                        <StyledButton onClick={open_sync_modal}>폴더 추가{React.createElement(AiOutlinePlus as any, {color: theme?.greyText, size: 18})}</StyledButton>
                    </div>
                }
            </Wrapper>
            <ReactModal
                ariaHideApp={false}
                isOpen={driveModalVisible}
                style={{
                    overlay: {
                        background: 'rgba(0,0,0,.4)'
                    },
                    content: {
                        borderRadius: '10px',
                        transform: 'translate(-50%, -50%)',
                        marginRight: '-50%',
                        top: '50%',
                        left: '50%',
                        right: 'auto',
                        bottom: 'auto',
                        width:'300px'
                    }
                }}
            >
                <div>
                    <TitleText>{t('DriveSetting')}
                        {React.createElement(AiOutlineClose as any, { 
                            style: { color: theme!.iconColor, cursor: "pointer" },
                            onClick: close_drive_modal
                        })}
                    </TitleText>
                    <ModalBody>
                        <div className="flex">
                            <input className="f-1" value={driveName} onChange={(e)=>{setDriveName(e.target.value)}} />
                            <select onChange={(e)=>setSelectedDrive(e.target.value)} style={{marginLeft: 10}} value={selectedDrive}>
                                <option value={virtualDriveInfo.drive_letter} selected={true}>{virtualDriveInfo.drive_letter + ':'}</option>
                            {
                                diskLetters.map((letter, index) => {
                                    return (<option key={'drive_letter_option_' + index} value={`${letter}`}>{letter + ':'}</option>);
                                })
                            }
                            </select>
                        </div>
                        <div style={{fontSize: theme!.defaultFontSize}}>변경 사항은 드라이브 재연결 시 적용됩니다.</div>
                    </ModalBody>
                    
                    <ModalBottom>
                        <button className="btn" onClick={close_drive_modal}>{t('Cancel')}</button>
                        <button className="btn btn-fill" onClick={set_virtual_drive}>{t('Confirm')}</button>
                    </ModalBottom>
                </div>
            </ReactModal>
            <ReactModal
                ariaHideApp={false}
                isOpen={syncModalVisible}
                style={{
                    overlay: {
                        background: 'rgba(0,0,0,.4)'
                    },
                    content: {
                        borderRadius: '10px',
                        transform: 'translate(-50%, -50%)',
                        marginRight: '-50%',
                        top: '50%',
                        left: '50%',
                        right: 'auto',
                        bottom: 'auto',
                        width:'300px'
                    }
                }}
            >
                <div>
                    <TitleText>{t('SyncSetting')}
                        {React.createElement(AiOutlineClose as any, { 
                            style: { color: theme!.iconColor, cursor: "pointer" },
                            onClick: close_sync_modal
                        })}
                    </TitleText>
                    <ModalBody className="mb-5">
                        <div>
                            내 컴퓨터 기기에 저장된 폴더와 MYDRIVE의 폴더를 1:1로 연결하고 서로 동일한 상태로 유지합니다.
                            동기화된 파일은 내 컴퓨터 하드 드라이브 공간을 차지하며 오프라인에서 사용할 수 있습니다.
                        </div>
                        <div>
                            <div className="mt-10">
                                <div className="mb-5"><label>내 컴퓨터 폴더</label></div>
                                <div className="flex" style={{columnGap:10}}>
                                    <input className="f-1" value={userDir} onChange={(e)=>{setUserDir(e.target.value)}} />
                                    <button className="btn" onClick={close_drive_modal}>{t('Select')}</button>
                                </div>
                            </div>
                            <div className="mt-10">
                                <div className="mb-5"><label>MYDRIVE 폴더</label></div>
                                <div className="flex" style={{columnGap:10}}>
                                    <input className="f-1" value={mydriveDir.fd_name} onChange={(e)=>{setMydriveDir(prev=> ({...prev, fd_name:e.target.value}))}} />
                                    <button className="btn" onClick={showSyncSetting}>{t('Select')}</button>
                                </div>
                            </div>
                        </div>
                    </ModalBody>
                    
                    <ModalBottom>
                        <button className="btn" onClick={close_sync_modal}>{t('Cancel')}</button>
                        <button className="btn btn-fill" onClick={add_sync_folder}>{t('Confirm')}</button>
                    </ModalBottom>
                </div>
            </ReactModal>
        </Container>
    );
};

export default Setting;