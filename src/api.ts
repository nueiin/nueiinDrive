import axios from "axios";
import nueiinConfig from "./nueiin.json"

export async function fetchLog() {
  const loginUser = { userIdx: 702, userNum: null };

  const response = await axios.post(
    `${nueiinConfig.nueiinServer}/sync/read_log`,
    {
      user_idx: loginUser.userIdx,
      user_num: loginUser.userNum,
      device_name: loginUser.deviceName,
    },
    { withCredentials: true }
  );
  
  return response.data.content;
}
export async function fetchSettings() {
  const loginUser = { userIdx: 702, userNum: null };

  return await axios
  .post(`${nueiinConfig.nueiinServer}/setting/get_settings`, {
      user_idx: loginUser.userIdx,
      user_num: loginUser.userNum,
      device_name: loginUser.deviceName,
  }, { withCredentials: true })
  .then((res) => res.data);
}

export async function fetchSyncFolder() {
  const loginUser = { userIdx: 702, userNum: null };

  return await axios
  .post(`${nueiinConfig.nueiinServer}/setting/get_settings`, {
      user_idx: loginUser.userIdx,
      user_num: loginUser.userNum,
      device_name: loginUser.deviceName,
  }, { withCredentials: true })
  .then((res) => res.data.sync.sync_folder);
}
