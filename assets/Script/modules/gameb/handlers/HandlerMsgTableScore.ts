import { Logger } from "../../lobby/lcore/LCoreExports";
import { proto } from "../../lobby/protoHH/protoHH";
import { RoomInterface } from "../RoomInterface";

/**
 * 结算
 */
export namespace HandlerMsgTableScore {
    export const onMsg = async (msgData: ByteBuffer, room: RoomInterface): Promise<void> => {
        const reply = proto.casino.packet_table_score.decode(msgData);
        Logger.debug("HandlerMsgTableScore----------------------- ", reply);
        const play_total = reply.tdata.play_total;
        const round = reply.tdata.round;
        // const curcards = reply.scores[0].curcards;
        const disband_type = reply.tdata.disband_type;
        // Logger.debug("HandlerMsgTableScore----- disband_type------------------ ", disband_type);
        if (disband_type !== null || play_total >= round) {
            // if (room.isDisband || play_total >= round) {
            //解散 或者 回合数打完的时候 会显示大结算界面
            room.loadGameOverResultView(reply);
        } else {
            // 显示手牌输赢结果
            room.loadHandResultView(reply);
        }
    };
}
