'use client'

import { Reducer } from 'redux'

import { PeerActionType, PeerState } from './peerTypes'

export const initialState: PeerState = {
  id: undefined,
  loading: false,
  started: false,
}

export const PeerReducer: Reducer<PeerState> = (state = initialState, action: any) => {
  switch (action.type) {
    case PeerActionType.PEER_SESSION_START:
      const { id } = action
      if (typeof id !== 'string' && id !== undefined) {
        throw new Error('Invalid id type')
      }
      return { ...state, id, started: true }
    case PeerActionType.PEER_SESSION_STOP:
      return { ...initialState }
    case PeerActionType.PEER_LOADING:
      const { loading } = action
      return { ...state, loading }
    case PeerActionType.PEER_UPLOAD_PROGRESS:
      const { progress } = action
      return { ...state, uploadProgress: progress }
    default:
      return state
  }
}
