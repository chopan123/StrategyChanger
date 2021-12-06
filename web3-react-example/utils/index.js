import { Contract } from '@ethersproject/contracts'

export function getProviderOrSigner(library, account) {
  return account ? getSigner(library, account) : library
}

export function getContract(address, ABI, library, account) {

  return new Contract(address, ABI, getProviderOrSigner(library, account))
}

// account is not optional
export function getSigner(library, account) {
  return library.getSigner(account).connectUnchecked()
}
