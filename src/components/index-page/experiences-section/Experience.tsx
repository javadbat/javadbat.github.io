import React, { useMemo } from 'react';

function Experience({name,fromDate,ToDate}) {
    const FromDateString = useMemo(()=>{return Intl.DateTimeFormat("en",{dateStyle:"medium"}).format(new Date(fromDate)) },[fromDate])
    const ToDateString = useMemo(()=>{return Intl.DateTimeFormat("en",{dateStyle:"medium"}).format(new Date(ToDate)) },[ToDate]);
  return (
    <div>
        {name} {FromDateString}-{ToDateString}
    </div>
  )
}

export default Experience;