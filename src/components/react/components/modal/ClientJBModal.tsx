import { useEffect, useState, type ComponentType } from 'react'
import type { Props as JBModalProps } from 'jb-modal/react'
import './modal-style.css';
type JBModalComponent = ComponentType<JBModalProps>

export function ClientJBModal(props: JBModalProps) {
  const [JBModal, setJBModal] = useState<JBModalComponent | null>(null)

  useEffect(() => {
    let isMounted = true

    import('jb-modal/react').then((module) => {
      if (isMounted) {
        setJBModal(() => module.JBModal as JBModalComponent)
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  if (!JBModal) {
    return null
  }

  return <JBModal {...props} />
}
