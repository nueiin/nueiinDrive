import React, { useState, useEffect, useContext } from "react";
import styled, { ThemeContext } from "styled-components";
import axios from 'axios';
import nueiinConfig from "../../nueiin.json"
import { VirtualDriveStatusContext, SyncStatusContext } from "../../contexts";
import "../../i18n.config";
import { useTranslation } from "react-i18next";
import ReactModal from "react-modal";
import { AiOutlinePlus, AiOutlineMinus } from 'react-icons/ai';
import { PiFolderSimpleDuotone, PiFolderOpenDuotone } from "react-icons/pi";
import "../../Style.css";
import { UncontrolledTreeEnvironment, ControlledTreeEnvironment, Tree, StaticTreeDataProvider } from 'react-complex-tree';
import 'react-complex-tree/lib/style-modern.css';

const Container = styled.div`
    background-color:${props => props.theme.background};
    width:100vw;
    overflow-y:hidden;
    display:flex;
    height:100vh;
`;
const TitleBox = styled.div`
    position:absolute;
    top:0px;
    width: 100vw;
    height: 50px;
    padding: 5px 10px;
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
const Wrapper = styled.div`
    flex:1;
    width: calc(100vw - 40px);
    overflow-y:auto;
    position:absolute;
    top:40px;
    display:flex;
    flex-direction: column;
    padding: 20px;
    font-size:${props => props.theme.defaultFontSize};
`;
const SyncFolderBox = styled.div`
    border:1px solid ${props => props.theme.borderColor};
    margin-top:10px;
    padding:10px;
    align-items:center;
    overflow-y:auto;
    height: calc(100vh - 250px);
`;
const SyncFolder = styled.div`
    display: flex;
    align-items:center;
    column-gap:5px;
    cursor:pointer;
`;
const BottomBox = styled.div`
    position:absolute;
    bottom: 0;
    width: calc(100vw - 40px);
    padding:20px;
    display:flex;
    align-items:center;
    justify-content: space-between;
    div {
        display:flex;
        column-gap:10px;
    }
`;

const SyncSetting: React.FC = () => {
    const { ipcRenderer } = window.require('electron');

    const loginUser = { userIdx: 702, userNum: null, deviceName: 'Windows_DESKTOP-53QA2LB' };
    const { isSyncActive, sync } = useContext(SyncStatusContext);
    const { isVirtualDriveActive, virtualDrive } = useContext(VirtualDriveStatusContext);
    const { t } = useTranslation();
    const theme = useContext(ThemeContext);

    const [myFolders, setMyFolders] = useState<{[key: string]: { index: string, isFolder: boolean, children: string[], data: any[], fd_size?:string, isFolderIcon?:boolean }}>({
        root: {
            index: 'root',
            isFolder: true,
            children: ['MYDRIVE'],
            data: ['','Root item'],
        },
        MYDRIVE: {
            index: 'MYDRIVE',
            isFolder: true,
            children: ['SHARE'],
            data: ['all','MYDRIVE'],
        },
    });
    const [focusedItem, setFocusedItem] = useState<any>({});
    const [expandedItems, setExpandedItems] = useState<any[]>(['MYDRIVE']);
    const [selectedItem, setSelectedItem] = useState<any>();
    const [disk, setDisk] = useState<{letter:String, free:String}>({letter: '', free: ''});

    useEffect(() => {
        ipcRenderer.send('exec', { type: 'shell', action: 'disk_free' });
        
        ipcRenderer.on('disk_free', (event?:any, arg?:any) => {
            if (arg.free) {
                setDisk(prevState => ({...prevState, free:arg.free}));
            }
            if (arg.letter) {
                setDisk(prevState => ({...prevState, letter:arg.letter}));
            }
        });
    }, [])

    useEffect(() => {
        get_mydrive_folders('all', 'MYDRIVE');
    }, [])

    useEffect(() => {
        console.log(selectedItem);
    }, [selectedItem])

    const get_mydrive_folders = async (sch_type:String, sch_fd_idx:string) => {
            var fd_idx:any = sch_fd_idx;
            if (sch_fd_idx == 'MY') fd_idx = '0';
            if (sch_fd_idx == 'SHARED') fd_idx = null;
            // 폴더 동기화 활성화 
            try {
                const response = await axios
                    .post(`${nueiinConfig.nueiinServer}/setting/get_mydrive_folders`, {
                        user_idx: loginUser.userIdx,
                        user_num: loginUser.userNum,
                        sch_type: sch_type,
                        sch_fd_idx: fd_idx,
                    }, { withCredentials: true });
                if (!response.data.status) {
                    console.log('error');
                    return;
                }
                if (response.data.my) {
                    var data = response.data.my;
                    var children:any[] = [];
                    var tmp:any = {};
                    data.map((d:any, index:any) => {
                        var fd_size = d.fd_size === '' ? d.fd_size : d.fd_size + 'B';
                        var is_folder = d.count > 0 ? true : false
                        tmp[d.fd_idx] = {
                            index: d.fd_idx,
                            isFolder: is_folder,
                            children: [],
                            data: ['MY', d.fd_name],
                            fd_size: fd_size,
                            isFolderIcon:true
                        }
                        children.push(d.fd_idx);
                    })
                    setMyFolders(prevData => {
                        prevData[sch_fd_idx].children = children;
                        return ({
                            ...prevData,
                            ...tmp
                        });
                    });
                } else if (response.data.shared) {
                    var data = response.data.shared;
                    var children:any[] = [];
                    var tmp:any = {};
                    data.map((d:any, index:any) => {
                        var fd_size = d.fd_size === '' ? d.fd_size : d.fd_size + 'B';
                        var is_folder = d.count > 0 ? true : false
                        tmp[d.fd_idx] = {
                            index: d.fd_idx,
                            isFolder: is_folder,
                            children: [],
                            data: ['SHARED', d.fd_name],
                            fd_size: fd_size,
                            isFolderIcon:true
                        }
                        children.push(d.fd_idx);
                    });
                    setMyFolders(prevData => {
                        prevData[sch_fd_idx].children = children;
                        return ({
                            ...prevData,
                            ...tmp
                        });
                    });
                    
                } else if (response.data.all) {
                    var data = response.data.all;
                    var children:any[] = [];
                    var tmp:any = {};
                    data.map((d:any, index:any) => {
                        var fd_size = d.fd_size === '' ? d.fd_size : d.fd_size + 'B';
                        var is_folder = d.count > 0 ? true : false
                        tmp[d.fd_idx] = {
                            index: d.fd_idx,
                            isFolder: is_folder,
                            children: [],
                            data: [d.fd_idx, t(d.fd_name)],
                            fd_size: fd_size
                        }
                        children.push(d.fd_idx);
                    });
                    setMyFolders(prevData => {
                        prevData[sch_fd_idx].children = children;
                        return ({
                            ...prevData,
                            ...tmp
                        });
                    });
                }
            } catch (e) {
                console.log("Connection Failed " + e);
            } finally {
                setExpandedItems([...expandedItems, sch_fd_idx]);
            }
    }

    const create_folder = async () => {
        if (selectedItem.data[0].indexOf('MY') !== -1) {
            var tmp:any = {};
            // db에 새 폴더 추가
            setMyFolders(prevData => {
                var children:any[] = [...prevData[selectedItem.index].children];
                children.push('new');
                tmp['new'] = {
                    index: 'new',
                    isFolder: false,
                    children: [],
                    data: ['MY', '새 폴더'],
                    fd_size: '0',
                    isFolderIcon: true
                }
                prevData[selectedItem.index].children = children;
                return ({
                    ...prevData,
                    ...tmp
                });
            });
            get_mydrive_folders(selectedItem.data[0], selectedItem.index as string)
        } else {

        }
    }

    const renderItemTitle = ({ item, context, info }:{ item:any, context:any, info:any }) => {
        return (
            <SyncFolder onClick={()=>setSelectedItem(item)}>
                <span>
                    {!item.isFolderIcon && <img src={process.env.PUBLIC_URL + '/assets/icons/mydrive.svg'} width={16} height={16} />}
                    {item.isFolderIcon && context.isExpanded && React.createElement(PiFolderOpenDuotone as any, {color: theme!.pointColor, size: 16})}
                    {item.isFolderIcon && !context.isExpanded && React.createElement(PiFolderSimpleDuotone as any, {color: theme!.pointColor, size: 16})}
                </span>
                <span style={selectedItem?.index === item.index ? { backgroundColor: theme!.pointLightColor} : {}}>{item.data[1]}</span>
            </SyncFolder>
        );
    }
    const renderItemArrow = ({ item, context }:{ item:any, context:any }) => {
        if (item.isFolder) {
            if (context.isExpanded) {
                return React.createElement(AiOutlineMinus as any, {
                    onClick: context.toggleExpandedState,
                    color: theme?.text,
                    size: 8,
                    style: {backgroundColor:theme!.greyBackground, marginRight:5, padding:1, border:`1px solid ${theme!.borderColor}`}
                });
            } else {
                return React.createElement(AiOutlinePlus as any, {
                    onClick: context.toggleExpandedState,
                    color: theme?.text,
                    size: 8,
                    style: {backgroundColor:theme!.greyBackground, marginRight:5, padding:1, border:`1px solid ${theme!.borderColor}`}
                });
            }
        }
        return null;
    }
    const renderItem = ({ title, arrow, depth, context, children }:{ title:any, arrow:any, depth:any, context:any, children:any }) => {
        return (
            <div>
                <SyncFolder>
                    {arrow}
                    {title}
                </SyncFolder>
                <ul>{children}</ul>
            </div>
        );
    }

    return (
        <Container>
            <TitleBox>
                <TitleText>{t('SelectFolder')}</TitleText>
            </TitleBox>
            <Wrapper>
                <div className="mb-5">{t('SelectFolderDescription')}</div>
                <SyncFolderBox>
                    {myFolders && 
                    <ControlledTreeEnvironment
                        items={myFolders}
                        getItemTitle={item => item.data[1]}
                        viewState={{
                            ['tree-1']: {
                                focusedItem,
                                expandedItems,
                                selectedItem,
                            },
                          }}
                        onFocusItem={item => setFocusedItem(item)}
                        onExpandItem={item => get_mydrive_folders(item.data[0], item.index as string)}
                        onCollapseItem={item =>
                            setExpandedItems(expandedItems.filter(expandedItemIndex => expandedItemIndex !== item.index))
                        }
                        // onSelectItems={items => setSelectedItems(items)}
                        renderItemTitle={renderItemTitle}
                        renderItemArrow={renderItemArrow}
                        renderItem={renderItem}
                        canReorderItems={true}
                        autoFocus={true}
                    >
                        <Tree treeId="tree-1" rootItem="root" />
                    </ControlledTreeEnvironment>
                    }
                </SyncFolderBox>
                <div className="flex mt-10">
                    <div className="f-1"><span>{t('SelectedFolderSize')}: {selectedItem?.fd_size}</span><span></span></div>
                    <div className="f-1"><span>{t('AvailablePCStorage')}({disk.letter}): {disk.free}GB</span><span></span></div>
                </div>
            </Wrapper>
            <BottomBox>
                <button className="btn" onClick={create_folder}>{t('NewFolder')}</button>
                <div className="flex btnWrapper">
                    <button className="btn" onClick={()=>{}}>{t('Cancel')}</button>
                    <button className="btn btn-fill" onClick={() => {}}>{t('Confirm')}</button>
                </div>
            </BottomBox>
        </Container>
    );
};

export default SyncSetting;