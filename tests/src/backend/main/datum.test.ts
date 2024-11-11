import { assert, test } from "vitest";

import {
  ActionHash,
  AppBundleSource,
  CreateLink,
  DeleteLink,
  fakeActionHash,
  fakeAgentPubKey,
  fakeEntryHash,
  Link,
  NewEntryAction,
  Record,
  SignedActionHashed,
} from "@holochain/client";
import { CallableCell, dhtSync, runScenario } from "@holochain/tryorama";
import { decode } from "@msgpack/msgpack";

import { createDatum, sampleDatum } from "./common.js";

test("create Datum", async () => {
  await runScenario(async scenario => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + "/../workdir/agent-centric-boilerplate.happ";

    // Set up the app to be installed
    const appSource = { appBundleSource: { path: testAppPath } };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    // Alice creates a Datum
    const record: Record = await createDatum(alice.cells[0]);
    assert.ok(record);
  });
});

test("create and read Datum", async () => {
  await runScenario(async scenario => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + "/../workdir/agent-centric-boilerplate.happ";

    // Set up the app to be installed
    const appSource = { appBundleSource: { path: testAppPath } };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    const sample = await sampleDatum(alice.cells[0]);

    // Alice creates a Datum
    const record: Record = await createDatum(alice.cells[0], sample);
    assert.ok(record);

    // Wait for the created entry to be propagated to the other node.
    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

    // Bob gets the created Datum
    const createReadOutput: Record = await bob.cells[0].callZome({
      zome_name: "main",
      fn_name: "get_original_datum",
      payload: record.signed_action.hashed.hash,
    });
    assert.deepEqual(sample, decode((createReadOutput.entry as any).Present.entry) as any);
  });
});

test("create and update Datum", async () => {
  await runScenario(async scenario => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + "/../workdir/agent-centric-boilerplate.happ";

    // Set up the app to be installed
    const appSource = { appBundleSource: { path: testAppPath } };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    // Alice creates a Datum
    const record: Record = await createDatum(alice.cells[0]);
    assert.ok(record);

    const originalActionHash = record.signed_action.hashed.hash;

    // Alice updates the Datum
    let contentUpdate: any = await sampleDatum(alice.cells[0]);
    let updateInput = {
      original_datum_hash: originalActionHash,
      previous_datum_hash: originalActionHash,
      updated_datum: contentUpdate,
    };

    let updatedRecord: Record = await alice.cells[0].callZome({
      zome_name: "main",
      fn_name: "update_datum",
      payload: updateInput,
    });
    assert.ok(updatedRecord);

    // Wait for the updated entry to be propagated to the other node.
    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

    // Bob gets the updated Datum
    const readUpdatedOutput0: Record = await bob.cells[0].callZome({
      zome_name: "main",
      fn_name: "get_latest_datum",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    assert.deepEqual(contentUpdate, decode((readUpdatedOutput0.entry as any).Present.entry) as any);

    // Alice updates the Datum again
    contentUpdate = await sampleDatum(alice.cells[0]);
    updateInput = {
      original_datum_hash: originalActionHash,
      previous_datum_hash: updatedRecord.signed_action.hashed.hash,
      updated_datum: contentUpdate,
    };

    updatedRecord = await alice.cells[0].callZome({
      zome_name: "main",
      fn_name: "update_datum",
      payload: updateInput,
    });
    assert.ok(updatedRecord);

    // Wait for the updated entry to be propagated to the other node.
    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

    // Bob gets the updated Datum
    const readUpdatedOutput1: Record = await bob.cells[0].callZome({
      zome_name: "main",
      fn_name: "get_latest_datum",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    assert.deepEqual(contentUpdate, decode((readUpdatedOutput1.entry as any).Present.entry) as any);

    // Bob gets all the revisions for Datum
    const revisions: Record[] = await bob.cells[0].callZome({
      zome_name: "main",
      fn_name: "get_all_revisions_for_datum",
      payload: originalActionHash,
    });
    assert.equal(revisions.length, 3);
    assert.deepEqual(contentUpdate, decode((revisions[2].entry as any).Present.entry) as any);
  });
});

test("create and delete Datum", async () => {
  await runScenario(async scenario => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + "/../workdir/agent-centric-boilerplate.happ";

    // Set up the app to be installed
    const appSource = { appBundleSource: { path: testAppPath } };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    const sample = await sampleDatum(alice.cells[0]);

    // Alice creates a Datum
    const record: Record = await createDatum(alice.cells[0], sample);
    assert.ok(record);

    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

    // Alice deletes the Datum
    const deleteActionHash = await alice.cells[0].callZome({
      zome_name: "main",
      fn_name: "delete_datum",
      payload: record.signed_action.hashed.hash,
    });
    assert.ok(deleteActionHash);

    // Wait for the entry deletion to be propagated to the other node.
    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

    // Bob gets the oldest delete for the Datum
    const oldestDeleteForDatum: SignedActionHashed = await bob.cells[0].callZome({
      zome_name: "main",
      fn_name: "get_oldest_delete_for_datum",
      payload: record.signed_action.hashed.hash,
    });
    assert.ok(oldestDeleteForDatum);

    // Bob gets the deletions for the Datum
    const deletesForDatum: SignedActionHashed[] = await bob.cells[0].callZome({
      zome_name: "main",
      fn_name: "get_all_deletes_for_datum",
      payload: record.signed_action.hashed.hash,
    });
    assert.equal(deletesForDatum.length, 1);
  });
});
