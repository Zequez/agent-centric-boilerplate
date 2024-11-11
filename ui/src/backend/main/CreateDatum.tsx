import type { ActionHash, AgentPubKey, AppClient, DnaHash, EntryHash, Record } from "@holochain/client";
import { FC, useContext, useEffect, useState } from "react";

import { ClientContext } from "../../ClientContext";
import type { Datum } from "./types";

const CreateDatum: FC<CreateDatumProps> = ({ onDatumCreated }) => {
  const { client } = useContext(ClientContext);
  const [name, setName] = useState<string>("");
  const [dtype, setDtype] = useState<string>("");
  const [value, setValue] = useState<string>("");
  const [uuid, setUuid] = useState<string>("");
  const [isDatumValid, setIsDatumValid] = useState(false);

  const createDatum = async () => {
    const datumEntry: Datum = {
      name: name!,
      dtype: dtype!,
      value: value!,
      uuid: uuid!,
    };
    try {
      const record = await client?.callZome({
        cap_secret: null,
        role_name: "backend",
        zome_name: "main",
        fn_name: "create_datum",
        payload: datumEntry,
      });
      onDatumCreated && onDatumCreated(record.signed_action.hashed.hash);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setIsDatumValid(true && name !== "" && dtype !== "" && value !== "" && uuid !== "");
  }, [name, dtype, value, uuid]);

  return (
    <div>
      <h3>Create Datum</h3>
      <div>
        <label htmlFor="Name">Name</label>
        <input type="text" name="Name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div>
        <label htmlFor="Dtype">Dtype</label>
        <input type="text" name="Dtype" value={dtype} onChange={(e) => setDtype(e.target.value)} />
      </div>

      <div>
        <label htmlFor="Value">Value</label>
        <textarea name="Value" value={value} onChange={(e) => setValue(e.target.value)} required></textarea>
      </div>

      <div>
        <label htmlFor="Uuid">Uuid</label>
        <input type="text" name="Uuid" value={uuid} onChange={(e) => setUuid(e.target.value)} />
      </div>

      <button disabled={!isDatumValid} onClick={() => createDatum()}>
        Create Datum
      </button>
    </div>
  );
};

interface CreateDatumProps {
  onDatumCreated?: (hash?: Uint8Array) => void;
}

export default CreateDatum;
