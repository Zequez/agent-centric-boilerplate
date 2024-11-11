import {
  ActionHash,
  AppBundleSource,
  fakeActionHash,
  fakeAgentPubKey,
  fakeDnaHash,
  fakeEntryHash,
  NewEntryAction,
  Record,
} from "@holochain/client";
import { CallableCell } from "@holochain/tryorama";

export async function sampleDatum(cell: CallableCell, partialDatum = {}) {
  return {
    ...{
      name: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      dtype: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      value: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      uuid: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    },
    ...partialDatum,
  };
}

export async function createDatum(cell: CallableCell, datum = undefined): Promise<Record> {
  return cell.callZome({
    zome_name: "main",
    fn_name: "create_datum",
    payload: datum || await sampleDatum(cell),
  });
}
