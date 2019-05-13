import * as React from 'react'

import Mail from '../Mail/Mail'

const Imprint = () => {
  return (
    <section className="Imprint">
      <h1>Imprint</h1>
      <h2>BOTLabs GmbH</h2>
      <p>
        Keithstraße 2-4, 10787 Berlin, Germany
        <br />
        Commercial Court: Amtsgericht Charlottenburg, Berlin, Germany
        <br />
        Registration Number: HRB 193450B
        <br />
        Managing Director: Ingo Rübe
        <br />
        <br />
        Contact: Ingo Rübe
        <br />
        <Mail mail={'info@botlabs.org'} />
        <br />
        <br />
        [Requirements according to § 5 TMG (Germany)]
        <br />
      </p>
    </section>
  )
}

export default Imprint
