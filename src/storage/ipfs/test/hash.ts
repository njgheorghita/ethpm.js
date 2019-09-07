import { v2 } from "../../../manifests/v2";

import hash from "../../../storage/ipfs/hash";

import examples from "../../../../test/examples/manifests";

it("hashes manifests", async () => {
  const standardToken = examples["standard-token"];
  const piperCoin = examples["piper-coin"];

  const buildDependencies = (await v2.read(piperCoin)).buildDependencies;

  const { hostname: expected } = buildDependencies["standard-token"];
  const actual: string = await hash(standardToken);

  expect(actual).toEqual(expected);
});
