import { HolochainError, Record } from "@holochain/client";
import { decode } from "@msgpack/msgpack";
import { FC, useCallback, useContext, useEffect, useState } from "react";

import { ClientContext } from "../../ClientContext";
import EditDatum from "./EditDatum";
import type { Datum } from "./types";

const DatumDetail: FC<DatumDetailProps> = ({ datumHash, onDatumDeleted }) => {
  const { client } = useContext(ClientContext);
  const [record, setRecord] = useState<Record | undefined>(undefined);
  const [datum, setDatum] = useState<Datum | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<HolochainError | undefined>();

  const fetchDatum = useCallback(async () => {
    setLoading(true);
    setRecord(undefined);
    try {
      const result = await client?.callZome({
        cap_secret: null,
        role_name: "backend",
        zome_name: "main",
        fn_name: "get_latest_datum",
        payload: datumHash,
      });
      setRecord(result);
      setLoading(false);
    } catch (e) {
      setError(e as HolochainError);
    } finally {
      setLoading(false);
    }
  }, [client, datumHash]);

  const deleteDatum = async () => {
    setLoading(true);
    try {
      await client?.callZome({
        cap_secret: null,
        role_name: "backend",
        zome_name: "main",
        fn_name: "delete_datum",
        payload: datumHash,
      });
      onDatumDeleted && onDatumDeleted(datumHash);
    } catch (e) {
      setError(e as HolochainError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!datumHash) {
      throw new Error(`The datumHash prop is required for this component`);
    }
    fetchDatum();
  }, [fetchDatum, datumHash]);

  useEffect(() => {
    if (!record) return;
    setDatum(decode((record.entry as any).Present.entry) as Datum);
  }, [record]);

  if (loading) {
    return <progress />;
  }

  if (error) {
    return <div className="alert">Error: {error.message}</div>;
  }

  return (
    <div>
      {editing
        ? (
          <div>
            <EditDatum
              originalDatumHash={datumHash}
              currentRecord={record}
              currentDatum={datum}
              onDatumUpdated={async () => {
                setEditing(false);
                await fetchDatum();
              }}
              onEditCanceled={() => setEditing(false)}
            />
          </div>
        )
        : record
        ? (
          <section>
            <div>
              <span>
                <strong>Name:</strong>
              </span>
              <span>{datum?.name}</span>
            </div>
            <div>
              <span>
                <strong>Dtype:</strong>
              </span>
              <span>{datum?.dtype}</span>
            </div>
            <div>
              <span>
                <strong>Value:</strong>
              </span>
              <span>{datum?.value}</span>
            </div>
            <div>
              <span>
                <strong>Uuid:</strong>
              </span>
              <span>{datum?.uuid}</span>
            </div>
            <div>
              <button onClick={() => setEditing(true)}>edit</button>
              <button onClick={deleteDatum}>delete</button>
            </div>
          </section>
        )
        : <div className="alert">The requested datum was not found.</div>}
    </div>
  );
};

interface DatumDetailProps {
  datumHash: Uint8Array;
  onDatumDeleted?: (datumHash: Uint8Array) => void;
}

export default DatumDetail;
