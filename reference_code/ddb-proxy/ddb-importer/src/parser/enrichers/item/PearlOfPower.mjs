/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class PearlOfPower extends DDBEnricherData {

  get type() {
    return "ddbmacro";
  }

  get activity() {
    return {
      name: "Use Pearl of Power",
      addItemConsume: true,
      data: {
        macro: {
          name: "Activate Macro",
          function: "ddb.item.pearlOfPower",
          visible: false,
          parameters: "",
        },
      },
    };
  }
}
