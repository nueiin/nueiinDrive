import 'styled-components';

// Colors 타입 정의
interface ColorsType {
    white: string;
    black: string;
    main: string;
    light_main: string;
    grey_0: string;
    grey_1: string;
    grey_2: string;
    grey_3: string;
    red: string;
    green_bg: string;
    dark_grey: string;
    grey_4: string;
    grey_5: string;
    grey_6: string;
    grey_7: string;
    yellow: string;
}

// Theme 타입 정의
interface ThemeType {
    background: string;
    text: string;
    redText: string;
    pointText: string;
    whiteText: string;
    greyText: string;
    darkGreyText: string;
    errorText: string;
    defaultFontSize: string;
    pointFontSize: string;
    bigFontSize: string;
    big2FontSize: string;
    smallFontSize: string;
    miniFontSize: string;
    disabledText: string;
    emojiSize: string;
    greyBackground: string;
    greyBackground2: string;
    darkGreyBackground: string;
    pointBorder: string;
    pointColor: string; 
    pointBgColor: string;
    iconColor: string;
    iconWhiteColor: string;
    iconDarkColor: string;
    borderLightColor: string;
    borderColor: string;
    placeholderColor: string;
    chatBoxColor: string;
    inputBorder: string;
    chartBackground: string;
    swipeBackground: string;
    redBackground: string;
    favoriteColor: string;
    pointLightColor: string;

    // Switch
    switchEnableColor: string;
    switchEnableIndicator: string;
    switchDisableColor: string;
    switchDisableIndicator: string;

    // Button
    btnBackground: string;
    btnTitle: string;
    btnTextLink: string;
    btnFontSize: string;
    btnDisabledBackground: string;
    btnDisabledTitle: string;
    cancelButtonBackground: string;
    cancelButtonText: string;
    btnHoverBackground: string;
    btnBorderColor: string;

    // Image
    imgBackground: string;
    imgBtnBackground: string;
    imgBtnIcon: string;

    // Input
    inputBackground: string;
    inputLabel: string;
    inputPlaceholder: string;
    inputFocusBorder: string;
    inputLabelFontSize: string;
    inputTextSize: string;
    iconSize: number;

    // Spinner
    spinnerBackground: string;
    spinnerIndicator: string;

    // Tab
    tabTintActive: string;
    tabTintInactive: string;
    tabBtnActive: string;
    tabBtnInactive: string;

    // List - Item
    itemBorder: string;
    itemTime: string;
    itemDesc: string;
    itemIcon: string;
    itemBadge: string;
    itemBadgeText: string;

    // Chat
    sendBtnActive: string;
    sendBtnInactive: string;
    listPointColor: string;

    // ChatRoom
    receivedBox: string;
    sentBox: string;
    chatFontSize: string;
    chatSmallFontSize: string;
    chatMiniFontSize: string;
    chatIconSize: number;

    // 기타
    defaultColor: string;
    backgroundTransparent: string;
    defaultBlue: string;
    leftBubbleBackground: string;
    carrot: string;
    emerald: string;
    peterRiver: string;
    wisteria: string;
    alizarin: string;
    turquoise: string;
    midnightBlue: string;
    optionTintColor: string;
    timeTextColor: string;
}

// Colors 객체
const Colors: ColorsType = {
    white: '#ffffff',
    black: '#000000',
    main: '#9f5cf6',
    light_main: '#e2cffc',
    grey_0: '#F2F2F2',
    grey_1: '#b3b3b3',
    grey_2: '#757575',
    grey_3: '#F9F9F9',
    red: '#FF6E5F',
    green_bg: '#E8F3D6',
    dark_grey: '#595757',
    grey_4: '#d8d8d8',
    grey_5: '#e2e2e2',
    grey_6: '#EEEEEE',
    grey_7: '#E3E3E3',
    yellow: '#FFF200',
};

// Theme 객체
export const theme: ThemeType = {
    background: Colors.white,
    text: Colors.black,
    redText: Colors.red,
    pointText: Colors.main,
    whiteText: Colors.white,
    greyText: Colors.grey_2,
    darkGreyText: Colors.dark_grey,
    errorText: Colors.red,
    defaultFontSize: '12px',
    pointFontSize: '18px',
    bigFontSize: '14px',
    big2FontSize: '16px',
    smallFontSize: '11px',
    miniFontSize: '10px',
    disabledText: Colors.grey_1,
    emojiSize: '14px',
    greyBackground: Colors.grey_0,
    greyBackground2: Colors.grey_3,
    darkGreyBackground: Colors.dark_grey,
    pointBorder: Colors.main,
    pointColor: Colors.main,
    pointBgColor: Colors.main,
    iconColor: Colors.grey_1,
    iconWhiteColor: Colors.white,
    iconDarkColor: Colors.dark_grey,
    borderLightColor: Colors.grey_0,
    borderColor: Colors.grey_4,
    placeholderColor: Colors.grey_5,
    chatBoxColor: Colors.grey_5,
    inputBorder: Colors.grey_4,
    chartBackground: Colors.grey_4,
    swipeBackground: Colors.grey_5,
    redBackground: Colors.red,
    favoriteColor: Colors.yellow,
    pointLightColor: Colors.light_main,

    // Switch
    switchEnableColor: Colors.grey_0,
    switchEnableIndicator: Colors.main,
    switchDisableColor: Colors.grey_1,
    switchDisableIndicator: Colors.grey_2,

    // Button
    btnBackground: Colors.main,
    btnTitle: Colors.white,
    btnTextLink: Colors.main,
    btnFontSize: '12px',
    btnDisabledBackground: Colors.grey_4,
    btnDisabledTitle: Colors.black,
    cancelButtonBackground: Colors.grey_1,
    cancelButtonText: Colors.black,
    btnHoverBackground: Colors.dark_grey,
    btnBorderColor: Colors.dark_grey,

    // Image
    imgBackground: Colors.grey_5,
    imgBtnBackground: Colors.grey_1,
    imgBtnIcon: Colors.white,

    // Input
    inputBackground: Colors.white,
    inputLabel: Colors.grey_1,
    inputPlaceholder: Colors.grey_1,
    inputFocusBorder: Colors.main,
    inputLabelFontSize: '12px',
    inputTextSize: '12px',
    iconSize: 20,

    // Spinner
    spinnerBackground: Colors.black,
    spinnerIndicator: Colors.white,

    // Tab
    tabTintActive: Colors.main,
    tabTintInactive: Colors.grey_1,
    tabBtnActive: Colors.main,
    tabBtnInactive: Colors.grey_1,

    // List - Item
    itemBorder: Colors.grey_0,
    itemTime: Colors.grey_1,
    itemDesc: Colors.grey_1,
    itemIcon: Colors.black,
    itemBadge: Colors.red,
    itemBadgeText: Colors.white,

    // Chat
    sendBtnActive: Colors.main,
    sendBtnInactive: Colors.grey_1,
    listPointColor: Colors.main,

    // ChatRoom
    receivedBox: Colors.grey_0,
    sentBox: Colors.green_bg,
    chatFontSize: '14px',
    chatSmallFontSize: '12px',
    chatMiniFontSize: '11px',
    chatIconSize: 24,

    // 기타
    defaultColor: '#b2b2b2',
    backgroundTransparent: 'transparent',
    defaultBlue: '#0084ff',
    leftBubbleBackground: '#f0f0f0',
    carrot: '#e67e22',
    emerald: '#2ecc71',
    peterRiver: '#3498db',
    wisteria: '#8e44ad',
    alizarin: '#e74c3c',
    turquoise: '#1abc9c',
    midnightBlue: '#2c3e50',
    optionTintColor: '#007AFF',
    timeTextColor: '#aaa',
};

// styled-components DefaultTheme 타입 확장
declare module 'styled-components' {
    export interface DefaultTheme extends ThemeType {}
}
