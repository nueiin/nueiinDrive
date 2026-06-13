import React, { useState, useContext, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import Main from './Main';
import { Setting, SyncSetting } from '../screens';
import "../i18n.config";
import { useTranslation } from "react-i18next";
import { HashRouter } from "react-router-dom";
import axios from 'axios';
import nueiinConfig from "../nueiin.json";

function Navigation() {
    const loginUser = { userIdx: 702, userNum: null, deviceName: 'Windows_DESKTOP-53QA2LB' };
    const { i18n } = useTranslation();

    return (
        <HashRouter>
            <Routes>
                <Route path="/" element={<Main />} />
                <Route path="/Setting" element={<Setting />} />
                <Route path="/SyncSetting" element={<SyncSetting />} />
            </Routes>
        </HashRouter>
    );
}
export default Navigation;