import { ParserDebug } from "../../utils";
import { TYPES } from "../utils";

export const debug = ParserDebug.extend("schemapack").extend("encoder");

const createEncoder = (
  schemas: Extensor.ParserMapSchemas,
  packetParser: Extensor.ParsersList
) => {
  return class Encoder {
    encode(packet: Extensor.ParserPacket, callback: (result: any) => void) {
      switch (packet.type) {
        case TYPES.EVENT:
        case TYPES.BINARY_EVENT:
          if (!(packet.data[0] in schemas)) {
            return callback([this.json(packet)]);
          }

          return callback([this.pack(packet)]);
        default:
          return callback([this.json(packet)]);
      }
    }

    json(packet: Extensor.ParserPacket) {
      try {
        debug("json packet %j", packet);
        return JSON.stringify(packet);
      } catch (e) {
        debug("json error: %s", e.message);
        return `{"type": ${TYPES.ERROR}, "data": "parser error"}`;
      }
    }

    pack(packet: Extensor.ParserPacket) {
      try {
        const eventName = packet.data[0];
        const eventSchema = packetParser[eventName];

        debug("binary packet %j", packet);

        return eventSchema.encode({
          _id: schemas[eventName].id,
          data: packet.data[1],
          nsp: packet.nsp,
          id: !("id" in packet) ? -1 : packet.id
        });
      } catch (e) {
        debug("binary error: %s", e.message);
        return `{"type": ${TYPES.ERROR}, "data": "parser error"}`;
      }
    }
  };
};

export default createEncoder;
