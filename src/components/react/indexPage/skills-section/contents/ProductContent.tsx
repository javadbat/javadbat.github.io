import React from 'react'
let done = false;

export default function ProductContent() {
  if (!done) {
    throw new Promise((r) =>
      setTimeout(() => {
        done = true;
        r(null);
      }, 10000)
    );
  }
  return (
    <div>ProductContent</div>
  )
}
