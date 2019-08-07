import { Logger, Dialog } from "../../lobby/lcore/LCoreExports";
import { proto } from "../../lobby/protoHH/protoHH";
import { Player } from "../Player";
import { RoomInterface } from "../RoomInterface";

/**
 * 响应服务器打牌通知
 */
export namespace HandlerActionResultDiscarded {
    export const onMsg = async (msgData: ByteBuffer, room: RoomInterface): Promise<void> => {
        const reply = proto.casino_xtsj.packet_sc_outcard_ack.decode(msgData);
        Logger.debug("HandlerMsgActionOutcardAck----------------------- ", reply);
        const player = <Player>room.getPlayerByUserID(`${reply.player_id}`);

        // const targetChairID = actionResultMsg.targetChairID;
        // const player = <Player>room.getPlayerByChairID(targetChairID);
        const discardTileId = reply.card;

        // const me = room.getMyPlayer();
        const isMe = player.isMe();
        const isReplayMode = room.isReplayMode();
        if (!isMe || isReplayMode) {
            player.discardOutTileID(discardTileId);
        }
        if (isMe) {
            player.cancelZiMo = false;
            room.showOrHideCancelCom(false);
            //清理界面
            player.playerView.clearAllowedActionsView(false);
        }
        //清理吃牌界面
        room.cleanUI();
        //加到打出牌列表
        player.addDicardedTile(discardTileId);
        const isPiao = room.mAlgorithm.getMahjongLaiZi() === reply.card;
        player.discarded2UI(true, false, isPiao);

        //有人飘赖子
        if (isPiao) {
            // await player.exposedResultAnimation(1002, true);
            room.mAlgorithm.setFlagPiao(true);
            player.mPiaoCount++;
            if (player.mPiaoCount === 3) {
                //第一次提示
                const backPlayer = <Player>room.getBackPlayer(player.chairID);
                if (!room.isReplayMode() && backPlayer.isMe()) {
                    Dialog.prompt("下家飘赖达到3次，锁牌生效，您将被限制碰牌、点笑、小朝天操作");
                }
            }

            return;
        }
        //made laji
        if (room.roomInfo.flag === 1 && room.roomInfo.players.length > 2) {
            const myPlayer = <Player>room.getMyPlayer();
            const nextPlayer = <Player>room.getNextPlayer(myPlayer.chairID);
            const isSuoPiao = nextPlayer.mPiaoCount > 2;
            if (isSuoPiao) {
                let str = "";
                if (myPlayer.notPong !== reply.card) {
                    const peng = room.mAlgorithm.canPeng_WithOther(myPlayer.tilesHand, reply.card);
                    if (peng.length > 0) {
                        str = `碰牌`;
                    }
                }
                const isCanGang = room.tilesInWall > room.roomInfo.players.length + 1; //最后几张不可杠 (赖根除外 因为朝天不摸牌)
                if (isCanGang || reply.card === room.laigenID) {
                    const gang = room.mAlgorithm.canGang_WithOther(myPlayer.tilesHand, reply.card);
                    if (gang.length > 0) {
                        if (reply.card === room.laigenID) {
                            str = `${str} 小朝天`;
                        } else {
                            str = `${str} 点笑`;
                        }
                    }
                }

                if (room.isReplayMode()) {
                    const backPlayer = <Player>room.getBackPlayer(player.chairID);
                    Dialog.prompt(`【${player.mNick}】飘赖${player.mPiaoCount}次，【${backPlayer.mNick}】限制【碰牌/点笑/小朝天】`);
                } else {
                    Dialog.prompt(`下家飘赖${player.mPiaoCount}次，限制【${str}】`);
                }
            }
        }
    };
}
