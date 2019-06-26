import { Logger } from "../../lobby/lcore/LCoreExports";
import { proto } from "../../lobby/protoHH/protoHH";
import { RoomInterface } from "../RoomInterface";

/**
 * 解散请求
 */
export namespace HandlerMsgTableDisbandReq {
    export const onMsg = async (msgData: ByteBuffer, room: RoomInterface): Promise<void> => {
        const reply = proto.casino.packet_table_disband_req.decode(msgData);
        Logger.debug("HandlerMsgTableDisbandReq----------------------- ", reply);
    };
}
