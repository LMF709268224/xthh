import { CommonFunction, DataStore, Dialog, Enum, KeyConstants, LobbyModuleInterface, Logger } from "../../lcore/LCoreExports";
// tslint:disable-next-line:no-require-imports
import long = require("../../protobufjs/long");
import { proto } from "../../protoHH/protoHH";
import { LocalStrings } from "../../strings/LocalStringsExports";
import { InputNumberView } from "../InputNumberView";

const { ccclass } = cc._decorator;

const REWARD_IMG: { [key: number]: string } = {
    [proto.casino.eRESOURCE.RESOURCE_BEANS]: "ui://lobby_bg_package/ty_icon_hld",
    [proto.casino.eRESOURCE.RESOURCE_CARD]: "ui://lobby_bg_package/ty_icon_fk",
    [proto.casino.eRESOURCE.RESOURCE_NONE]: "ui://lobby_bg_package/ty_icon_hld"
};

/**
 * RedPacketView
 */
@ccclass
export class RedPacketView extends cc.Component {
    private view: fgui.GComponent;
    private win: fgui.Window;
    private lm: LobbyModuleInterface;

    private redData: proto.casino.red_data;

    private playerRedData: proto.casino.Iplayer_red;

    private loginChannel: string;
    protected onLoad(): void {
        this.lm = <LobbyModuleInterface>this.getComponent("LobbyModule");
        const loader = this.lm.loader;
        loader.fguiAddPackage("lobby/fui_lobby_red_packet/lobby_red_packet");
        const view = fgui.UIPackage.createObject("lobby_red_packet", "redPacketView").asCom;

        CommonFunction.setViewInCenter(view);

        const mask = view.getChild("mask");
        CommonFunction.setBgFullScreenSize(mask);

        this.view = view;

        const win = new fgui.Window();
        win.contentPane = view;
        win.modal = true;

        this.win = win;

        this.initView();
        this.win.show();
    }

    protected onDestroy(): void {
        this.unRegisterHander();
        this.win.hide();
        this.win.dispose();

    }

    private registerHandler(): void {
        //
        this.lm.msgCenter.setGameMsgHandler(proto.casino.eMSG_TYPE.MSG_RED_CASH_ACK, this.oRedCashAck, this);
        this.lm.msgCenter.setGameMsgHandler(proto.casino.eMSG_TYPE.MSG_RED_STORE_ACK, this.onRedStoreAck, this);
        this.lm.msgCenter.setGameMsgHandler(proto.casino.eMSG_TYPE.MSG_ACT_ACK, this.onActAck, this);
    }
    private unRegisterHander(): void {
        //
    }

    private oRedCashAck(msg: proto.casino.ProxyMessage): void {
        //
        const redCashAck = proto.casino.packet_red_cash_ack.decode(msg.Data);
        Logger.debug("redCashAck = ", redCashAck);
    }
    private onRedStoreAck(msg: proto.casino.ProxyMessage): void {
        //
        const redStoreAck = proto.casino.packet_red_store_ack.decode(msg.Data);
        Logger.debug("redStoreAck = ", redStoreAck);
    }
    private onActAck(msg: proto.casino.ProxyMessage): void {
        //
        const actAck = proto.casino.packet_mail_ack.decode(msg.Data);
        Logger.debug("actAck = ", actAck);
    }

    private initView(): void {

        const closeBtn = this.view.getChild("closeBtn");
        closeBtn.onClick(this.onCloseBtnClick, this);

        const cashOutBtn = this.view.getChild("cashOutBtn");
        cashOutBtn.onClick(this.onCashOutBtnClick, this);

        const redDataStr = DataStore.getString(KeyConstants.RED_DATA);
        const redData = <proto.casino.red_data>JSON.parse(redDataStr);

        const playerRedDataStr = DataStore.getString(KeyConstants.PLAYER_RED);
        const playerRedData = <proto.casino.Iplayer_red>JSON.parse(playerRedDataStr);

        Logger.debug("redData = ", redData);
        Logger.debug("playerRedData = ", playerRedData);

        this.playerRedData = playerRedData;
        this.redData = redData;

        this.loginChannel = DataStore.getString(KeyConstants.CHANNEL);
        if (this.loginChannel === Enum.CHANNEL_TYPE.VISITOR || this.redData.red_disable) {
            cashOutBtn.grayed = true;
        }

        const red = +DataStore.getString(KeyConstants.RED);
        const redText = `${red / 100}`;
        this.view.getChild("count").text = redText;

        const cashTimesTF = this.view.getChild("text1");
        const cashOutLessTF = this.view.getChild("text2");

        const cashTime = playerRedData.cash_time;
        const today = this.isToday(cashTime);

        if (cashTime === null || !today) {
            cashTimesTF.text = LocalStrings.findString("cashOutTimes", `${redData.red_num}`);
            cashOutLessTF.text = LocalStrings.findString("cashOutLess", `${redData.red_cash / 100}`);

        } else {
            //
            const cashTimesLess = this.getCashTimesLess();

            cashTimesTF.text = LocalStrings.findString("cashOutTimes", `${cashTimesLess}`);

            if (cashTimesLess === 0) {
                cashOutBtn.grayed = true;
            }

            const cashOutLess = this.getCashOutLess();
            cashOutLessTF.text = LocalStrings.findString("cashOutLess", `${cashOutLess / 100}`);
        }

        this.initStores();
        this.registerHandler();

    }

    private initStores(): void {
        const list = this.view.getChild("list").asList;
        list.itemRenderer = (index: number, item: fgui.GObject) => {
            this.renderListItem(index, item);
        };
        list.setVirtual();
        list.numItems = this.redData.stores.length;

        this.registerHandler();
    }

    private onCashOutBtnClick(): void {
        //
        if (this.loginChannel === Enum.CHANNEL_TYPE.VISITOR) {
            Dialog.prompt(LocalStrings.findString("pleaseUseWeChatLogin"));

            return;
        }

        const playerRedData = this.playerRedData;

        const cashTimes = playerRedData.num_today;
        const cashOut = playerRedData.cash_today;

        const cashTime = playerRedData.cash_time;
        const red = +DataStore.getString(KeyConstants.RED);

        let errMsg = null;

        if (this.isToday(cashTime)) {
            // 次数限制
            if (cashTimes >= this.redData.red_num) {
                errMsg = LocalStrings.findString("cashTimesLimit");
            }
            // 额度限制
            if (cashOut >= this.redData.red_cash) {
                errMsg = LocalStrings.findString("cashOutLimit");
            }

        }

        //  金额时候大于提现额度最小值
        if (red < this.redData.red_min) {
            errMsg = LocalStrings.findString("lessThenMin", `${this.redData.red_min / 100}`);
        }

        if (errMsg !== null) {
            this.ready2CashOut();
        } else {

            Dialog.showDialog(errMsg);

        }
    }

    private ready2CashOut(): void {
        const inputNumberView = this.addComponent(InputNumberView);
        const cb = (str: string) => {
            const req2 = new proto.casino.packet_red_cash_req();
            req2.cash = +str;

            const buf = proto.casino.packet_red_cash_req.encode(req2);
            const lm = <LobbyModuleInterface>this.getComponent("LobbyModule");
            lm.sendGameMsg(buf, proto.casino.eMSG_TYPE.MSG_MAIL_REQ);
        };

        const minCash = `${this.redData.red_min / 100}`;
        const maxCash = `${this.redData.red_max / 100}`;
        const maxCashTimes = `${this.redData.red_num}`;
        const titleStr = LocalStrings.findString("inputRecordText", minCash, maxCash, maxCashTimes);
        inputNumberView.show(cb, titleStr, 1, 3);
    }

    private onCloseBtnClick(): void {
        this.destroy();
    }

    private onExchangeBtnClick(redStore: proto.casino.Ired_store): void {
        //

        if (this.loginChannel === Enum.CHANNEL_TYPE.VISITOR) {
            Dialog.prompt(LocalStrings.findString("pleaseUseWeChatLogin"));

            return;
        }
    }

    private renderListItem(index: number, obj: fgui.GObject): void {

        const redStoreItem = this.redData.stores[index];
        // Logger.debug("renderListItem redStoreItem = ", redStoreItem);

        const com = obj.asCom;
        com.getChild("name").text = redStoreItem.name;

        const resourceType = redStoreItem.type;
        const gain = redStoreItem.gains[0];
        com.getChild("loader").asLoader.url = REWARD_IMG[gain.id];

        const count = resourceType === proto.casino.eRESOURCE.RESOURCE_RED ? redStoreItem.price / 100 : redStoreItem.price;

        const text = LocalStrings.findString("exchangeText", `${count}`);
        const btn = com.getChild("exchangeBtn");
        btn.asCom.getChild("n1").text = text;
        btn.onClick(() => {
            this.onExchangeBtnClick(redStoreItem);
            // tslint:disable-next-line:align
        }, this);

        obj.onClick(() => {
            // tslint:disable-next-line:align
        }, this);

    }

    private isToday(timeStamp: Long): boolean {

        if (timeStamp === null) {

            return false;
        }

        // 不是对象，先new 个 long 对象，在toNumber();
        const cashTime = new long(timeStamp.low, timeStamp.high, timeStamp.unsigned);

        if (timeStamp !== null) {
            const cashDate = new Date(cashTime.toNumber() * 1000);
            const serverDate = new Date(this.lm.msgCenter.getServerTime() * 1000);
            Logger.debug("serverDate = ", serverDate.toString());
            Logger.debug("cashDate = ", cashDate.toString());

            const serverYear = serverDate.getFullYear();
            const serverMonth = serverDate.getMonth() + 1;
            const serverDay = serverDate.getDate();

            const cashYear = cashDate.getFullYear();
            const cashMonth = cashDate.getMonth() + 1;
            const cashDay = cashDate.getDate();

            if (cashYear === serverYear && cashMonth === serverMonth && cashDay === serverDay) {

                return true;
            }
        }

        return false;
    }

    private getCashTimesLess(): number {
        const cashTimes = this.playerRedData.num_today;

        return this.redData.red_num - cashTimes;
    }

    private getCashOutLess(): number {
        const cashOut = this.playerRedData.cash_today;

        return this.redData.red_max - cashOut;
    }
}
