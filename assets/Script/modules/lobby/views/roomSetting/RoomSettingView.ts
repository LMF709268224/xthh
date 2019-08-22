import { RoomHost } from "../../interface/LInterfaceExports";
import { CommonFunction, DataStore, Dialog, GResLoader, KeyConstants, Logger } from "../../lcore/LCoreExports";
import { LocalStrings } from "../../strings/LocalStringsExports";

export interface RoomInterface {
    switchBg(agree: number): void;
    onDissolveClicked(): void;

    onExitButtonClicked(): void;

    enableVoiceBtn(isShow: boolean): void;

    getRoomHost(): RoomHost;
}
/**
 * 设置界面
 */
export class RoomSettingView extends cc.Component {

    private view: fgui.GComponent;
    private eventTarget: cc.EventTarget;
    private win: fgui.Window;

    private room: RoomInterface;

    private musicBtn: fgui.GButton;
    private effectSoundBtn: fgui.GButton;
    private gpsBtn: fgui.GButton;
    private voiceBtn: fgui.GButton;
    // private musicSlider: fgui.GSlider;
    // private soundSlider: fgui.GSlider;

    public showView(room: RoomInterface, isOwner: boolean, loader: GResLoader): void {
        this.room = room;

        loader.fguiAddPackage("lobby/fui_room_other_view/room_other_view");

        const view = fgui.UIPackage.createObject("room_other_view", "setting").asCom;
        this.view = view;

        CommonFunction.setViewInCenter(view);

        const mask = view.getChild("spaceBg");
        mask.onClick(this.onSpaceBgClick, this);
        CommonFunction.setBgFullScreenSize(mask);

        const win = new fgui.Window();
        win.contentPane = view;
        win.modal = true;

        this.win = win;

        this.initView(isOwner);
        this.win.show();
    }

    protected onLoad(): void {
        this.eventTarget = new cc.EventTarget();
    }

    protected onDestroy(): void {

        this.eventTarget.emit("destroy");
        this.win.hide();
        this.win.dispose();
    }

    private initView(isOwner: boolean): void {

        // const bg = this.view.getChild("bg");
        // bg.onClick(this.onCloseClick, this);

        const btnExit = this.view.getChild("btnExit");
        btnExit.onClick(this.onLeaveRoomClick, this);

        const disbandBtn = this.view.getChild("btnDisband");
        disbandBtn.onClick(this.onDisbandBtnClick, this);

        this.gpsBtn = this.view.getChild("btnGPS").asButton;
        this.gpsBtn.onClick(this.onGpsBtnClick, this);

        this.voiceBtn = this.view.getChild("btnVoice").asButton;
        this.voiceBtn.onClick(this.onVoiceBtnClick, this);

        this.effectSoundBtn = this.view.getChild("btnYX").asButton;
        this.effectSoundBtn.onClick(this.onEffectSoundBtnClick, this);

        this.musicBtn = this.view.getChild("btnYY").asButton;
        this.musicBtn.onClick(this.onMusicSoundBtnClick, this);
        // this.musicBtnText = musicBtn.getChild("text");

        const gps = DataStore.getString("gps", "0");
        const recordVoice = DataStore.getString("voice", "0");
        const effectsVolume = DataStore.getString(KeyConstants.EFFECT_VOLUME, "0");
        const musicVolume = DataStore.getString(KeyConstants.MUSIC_VOLUME, "0");
        if (+gps > 0) {
            this.gpsBtn.selected = true;
        } else {
            this.gpsBtn.selected = false;
        }

        if (+recordVoice > 0) {
            this.voiceBtn.selected = true;
        } else {
            this.voiceBtn.selected = false;
        }

        if (+effectsVolume > 0) {
            this.effectSoundBtn.selected = true;
        } else {
            this.effectSoundBtn.selected = false;
        }

        if (+musicVolume > 0) {
            this.musicBtn.selected = true;
        } else {
            this.musicBtn.selected = false;
        }
    }

    private onSpaceBgClick(): void {
        this.destroy();
    }
    // private saveData(): void {
    //     DataStore.setItem("soundVolume", this.soundSlider.value.toString());
    //     DataStore.setItem("musicVolume", this.musicSlider.value.toString());
    // }
    // private onMusicSliderChanged(slider: fgui.GSlider): void {
    //     // Logger.debug("onMusicSliderChanged slider = ", slider.value
    //     cc.audioEngine.setMusicVolume(slider.value / 100);
    // }

    // private onSoundSliderChanged(slider: fgui.GSlider): void {
    //     // Logger.debug("onSoundSliderChanged slider = ", slider.value);
    //     cc.audioEngine.setEffectsVolume(slider.value / 100);
    // }

    // 0 关闭，1打开
    private changeGps(openOrClose: number): void {
        DataStore.setItem("gps", openOrClose);
        this.room.getRoomHost().eventTarget.emit("gpsChange");

        // 重新设置一遍按钮状态，避免状态不同步
        if (openOrClose > 0) {
            this.gpsBtn.selected = true;
        } else {
            this.gpsBtn.selected = false;
        }
    }

    private authorizeLocation(): void {
        Logger.debug("authorizeLocation");
        wx.authorize({
            scope: 'scope.userLocation',
            success: () => {
                // 用户已经同意小程序使用定位功能
                this.changeGps(1);
            },

            // tslint:disable-next-line:no-any
            fail: (err: any) => {
                Logger.debug("authorizeLocation fail:", err);
                // [右上角]-[关于]-[右上角]-[设置]

                Dialog.showDialog(LocalStrings.findString('openSettingToAuth'));

                this.changeGps(0);
            }
        });
    }

    private onGpsBtnClick(): void {
        if (this.gpsBtn.selected) {
            if (cc.sys.platform !== cc.sys.WECHAT_GAME) {
                Dialog.prompt(LocalStrings.findString("gpsEffectOnWeChat"));
                this.gpsBtn.selected = false;

                return;
            }

            wx.getSetting({
                success: (res: getSettingRes) => {
                    console.log(res);
                    const authSetting = <{ 'scope.userInfo': boolean; 'scope.userLocation': boolean }>res.authSetting;
                    if (!authSetting['scope.userLocation']) {
                        this.authorizeLocation();
                    } else {
                        this.changeGps(1);
                    }
                },

                // tslint:disable-next-line:no-any
                fail: (err: any) => {
                    Logger.error("getSetting error:", err);
                }
            });
        } else {
            this.changeGps(0);
        }

    }

    private onVoiceBtnClick(): void {
        this.room.enableVoiceBtn(this.voiceBtn.selected);

        if (this.voiceBtn.selected) {
            DataStore.setItem("voice", 1);
        } else {
            DataStore.setItem("voice", 0);
        }
    }

    // 音效开关
    private onEffectSoundBtnClick(): void {
        const effectVolume = cc.audioEngine.getEffectsVolume();
        Logger.debug("onEffectSoundBtnClick,effectVolume:", effectVolume);
        if (this.effectSoundBtn.selected) {
            cc.audioEngine.setEffectsVolume(1);
            DataStore.setItem(KeyConstants.EFFECT_VOLUME, 1);
        } else {
            cc.audioEngine.setEffectsVolume(0);
            DataStore.setItem(KeyConstants.EFFECT_VOLUME, 0);
        }
    }

    // 音乐开关
    private onMusicSoundBtnClick(): void {
        const musicVolume = cc.audioEngine.getMusicVolume();
        Logger.debug("onMusicSoundBtnClick,musicVolume:", musicVolume);
        if (this.musicBtn.selected) {
            cc.audioEngine.setMusicVolume(1);
            DataStore.setItem(KeyConstants.MUSIC_VOLUME, 1);
        } else {
            cc.audioEngine.setMusicVolume(0);
            DataStore.setItem(KeyConstants.MUSIC_VOLUME, 0);
        }
    }

    private onLeaveRoomClick(): void {
        Logger.debug("onLeaveRoomClick");
        Dialog.prompt(LocalStrings.findString("gameIsPlaying"));
    }

    private onDisbandBtnClick(): void {
        //
        Dialog.showDialog(LocalStrings.findString('disbandTips'), () => {

            this.sendDisbandMsg();
            // tslint:disable-next-line:align
        }, () => {
            //
        });
    }

    private sendDisbandMsg(): void {
        //
        this.room.onDissolveClicked();
    }

}
