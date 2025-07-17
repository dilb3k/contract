import { reactive, ref } from 'vue'

const modal = reactive({ list: [], visible: new Set() })
const timeOut = ref()

function useModal() {
  function open({ title, width, closable = false, component, props, emits }) {
    const modalKey = Date.now()
    props = { ...props, modalKey }
    emits = { ...emits }
    modal.list.push({
      title,
      width,
      closable,
      props: { modalKey, ...props },
      emits,
      component
    })
    modal.visible.add(modalKey)
  }

  function close(key) {
    modal.visible.delete(key)
    timeOut.value = setTimeout(() => {
      const index = modal.list.findIndex((item) => item.props.modalKey === key)
      if (index !== -1) {
        modal.list.splice(index, 1)
      }
      clearTimeout(timeOut.value)
    }, 400)
  }

  return { open, close, modal }
}

export default useModal
