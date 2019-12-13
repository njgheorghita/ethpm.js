/**
 * @module "ethpm/registries/web3"
 */

import Paged from "./paged";

import * as pkg from "ethpm/package";
import BN from "bn.js";
import Web3 from "web3";

type ResultType = Promise<pkg.PackageName>;

export default class PackagesCursor extends Paged<BN> implements IterableIterator<ResultType> {
  private pointer: BN;
  private length: BN;
  private web3: Web3;
  private registry: any;
  private packageIds: any;

  constructor(pageSize: BN, length: BN, web3: Web3, registry: any, packageIds: any) {
    super(pageSize);
    this.pointer = new BN(0);
    this.length = length.clone();
    this.web3 = web3;
    this.registry = registry;
	this.packageIds = packageIds;
	this.setPages(packageIds)
  }

  private getName(): IteratorResult<ResultType> {
    const promise: ResultType = new Promise((resolve, reject) => {
      const packageId = this.getDatum(this.pointer);
      if (packageId === null) {
        resolve("");
      }
      else {
		this.registry.methods.getPackageName(packageId).call().then((result) => {
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
	  return this.getName()
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
