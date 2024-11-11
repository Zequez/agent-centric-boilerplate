import { HolochainError, Record } from "@holochain/client";
import { FC, useCallback, useContext, useEffect, useState } from "react";

import { ClientContext } from "../../ClientContext";
import type { Datum } from "./types";

const EditDatum: FC<EditDatumProps> = ({
  originalDatumHash,
  currentRecord,
  currentDatum,
  onDatumUpdated,
  onDatumUpdateError,
  onEditCanceled,
}) => {
  const { client } = useContext(ClientContext);
  const [name, setName] = useState<string | undefined>(currentDatum?.name);
  const [dtype, setDtype] = useState<string | undefined>(currentDatum?.dtype);
  const [value, setValue] = useState<string | undefined>(currentDatum?.value);
  const [uuid, setUuid] = useState<string | undefined>(currentDatum?.uuid);
  const [isDatumValid, setIsDatumValid] = useState(false);

  const updateDatum = useCallback(async () => {
    const datum: Partial<Datum> = {
      name: name,
      dtype: dtype,
      value: value,
      uuid: uuid,
    };
    try {
      const updateRecord = await client?.callZome({
        cap_secret: null,
        role_name: "backend",
        zome_name: "main",
        fn_name: "update_datum",
        payload: {
          original_datum_hash: originalDatumHash,
          previous_datum_hash: currentRecord?.signed_action.hashed.hash,
          updated_datum: datum,
        },
      });
      onDatumUpdated(updateRecord.signed_action.hashed.hash);
    } catch (e) {
      onDatumUpdateError && onDatumUpdateError(e as HolochainError);
    }
  }, [
    client,
    currentRecord,
    onDatumUpdated,
    onDatumUpdateError,
    originalDatumHash,
    name,
    dtype,
    value,
    uuid,
  ]);

  useEffect(() => {
    if (!currentRecord) {
      throw new Error(`The currentRecord prop is required`);
    }
    if (!originalDatumHash) {
      throw new Error(`The originalDatumHash prop is required`);
    }
  }, [currentRecord, originalDatumHash]);

  useEffect(() => {
    setIsDatumValid(true && name !== "" && dtype !== "" && value !== "" && uuid !== "");
  }, [name, dtype, value, uuid]);

  return (
    <section>
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

      <div>
        <button onClick={onEditCanceled}>Cancel</button>
        <button onClick={updateDatum} disabled={!isDatumValid}>Edit Datum</button>
      </div>
    </section>
  );
};

interface EditDatumProps {
  originalDatumHash: Uint8Array;
  currentRecord: Record | undefined;
  currentDatum: Datum | undefined;
  onDatumUpdated: (hash?: Uint8Array) => void;
  onEditCanceled: () => void;
  onDatumUpdateError?: (error: HolochainError) => void;
}

export default EditDatum;
