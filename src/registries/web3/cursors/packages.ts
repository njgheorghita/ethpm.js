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
  private from: string;
  private to: string;

  constructor(pageSize: BN, length: BN, web3: Web3, from: string, to: string) {
    super(pageSize);
    this.pointer = new BN(0);
    this.length = length.clone();
    this.web3 = web3;
    this.from = from;
    this.to = to;
  }

  private getName(): IteratorResult<ResultType> {
    const promise: ResultType = new Promise((resolve, reject) => {
      const packageId = this.getDatum(this.pointer);
      if (packageId === null) {
        resolve(""); // TODO: empty string or something else?
      }
      else {
        const data = this.web3.eth.abi.encodeFunctionCall({
          name: "getPackageName",
          type: "function",
          inputs: [{
            type: "uint",
            name: "packageId"
          }]
        }, ["0x" + packageId.toString("hex")]);

        this.web3.eth.call({
          from: this.from,
          to: this.to,
          data
        }).then((result) => {
          resolve(this.web3.eth.abi.decodeParameter("string", result).toString());
        });
      }
    });

    this.pointer = this.pointer.addn(1);

    return {
      done: true,
      value: promise
    };
  }

  public next(): IteratorResult<ResultType> {
    if (this.pointer.lt(this.length)) {
      if (this.hasPage(this.pointer)) {
        // we have the page, return the number
        return this.getName();
      }
      else {
        // we don't have the page, get it
        const offset = this.pointer.sub(this.pointer.mod(this.pageSize));
        const limit = offset.add(this.pageSize).subn(1);

        const data = this.web3.eth.abi.encodeFunctionCall({
          name: "getAllPackageIds",
          type: "function",
          inputs: [{
            type: "uint",
            name: "offset"
          }, {
            type: "uint",
            name: "limit"
          }]
        }, ["0x" + offset.toString("hex"), "0x" + limit.toString("hex")]);

        const promise: ResultType = new Promise((resolve, reject) => {
          return this.web3.eth.call({
            from: this.from,
            to: this.to,
            data
          }).then((result) => {
            // split packageIds into an array of BNs
            // set the page
            // get/resolve the datum
            const results = this.web3.eth.abi.decodeParameters(["bytes32[]", "uint"], result);
            const packageIds = results[0].map((id: string) => new BN(id));
            this.setPage(this.pointer, packageIds);
            return this.getName();
          });
        });

        return {
          done: true,
          value: promise
        };
      }
    } else {
      const promise: ResultType = new Promise((resolve, reject) => {
        resolve(""); // TODO: empty string or something else?
      });

      this.pointer = this.pointer.addn(1);

      return {
        done: true,
        value: promise
      }
    }
  }

  [Symbol.iterator](): IterableIterator<ResultType> {
    return this;
  }
}
