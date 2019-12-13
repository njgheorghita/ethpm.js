/**
 * @module "ethpm/registries/web3"
 */

import Paged from "./paged";

import * as pkg from "ethpm/package";
import BN from "bn.js";
import Web3 from "web3";

//# this type is wrong
type ResultType = Promise<pkg.Version>;

export default class ReleasesCursor extends Paged<BN> implements IterableIterator<ResultType> {
  private pointer: BN;
  private length: BN;
  private web3: Web3;
  private packageName: string;
  private registry: any;
  private releaseIds: any

  constructor(pageSize: BN, length: BN, web3: Web3, registry: any, packageName: string, releaseIds: any) {
    super(pageSize);
    this.pointer = new BN(0);
    this.length = length.clone();
    this.web3 = web3;
    this.packageName = packageName;
	this.registry = registry;
	this.releaseIds = releaseIds;
	this.setPages(this.releaseIds)
  }

  private getReleaseData(): IteratorResult<ResultType> {
    const promise: ResultType = new Promise((resolve, reject) => {
      const releaseId = this.getDatum(this.pointer);
      if (releaseId === null) {
        resolve("");
      }
      else {
		this.registry.methods.getReleaseData(releaseId).call().then((result) => {
		  return resolve(result);
		});
      }
    });
    this.pointer = this.pointer.addn(1);
    return {
      done: false,
      value: promise
    };
  }

  public next(): IteratorResult<ResultType> {
    if (this.pointer.lt(this.length)) {
      return this.getReleaseData();
    } else {
      return {
        done: true,
        value: undefined
      }
    }
  }

  [Symbol.iterator](): IterableIterator<ResultType> {
    return this;
  }
}
