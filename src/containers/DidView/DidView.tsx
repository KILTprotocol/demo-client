import * as React from 'react'

import { Link } from 'react-router-dom'

import './DidView.scss'

const DidView = (props: any) => {
  return (
    <section className="DidView">
      <h1>DID DOCUMENT</h1>
      {props ? (
        <>
          <div className="attributes">
            <div>
              <label>Title</label>
              <div />
            </div>
            <div>
              <label>DID Document</label>
              <div>{/* <Code>{props}</Code> */}</div>
            </div>
          </div>
          <div className="actions">
            <Link to="/dashboard">Cancel</Link>
          </div>
        </>
      ) : (
        <>
          <div>Given Identity doesn't own a DID.</div>
          <div className="actions">
            <Link to="/dashboard">Cancel</Link>
          </div>
        </>
      )}
    </section>
  )
}

export default DidView
