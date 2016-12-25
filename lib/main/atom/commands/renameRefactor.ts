import {commands} from "./registry"
import {commandForTypeScript, getFilePathPosition} from "../atomUtils"
import {spanToRange} from "./../../utils/tsUtil"

commands.set("typescript:rename-refactor", deps => {
  return async e => {
    if (!commandForTypeScript(e)) {
      return
    }

    const location = getFilePathPosition()
    const client = await deps.getClient(location.file)
    const {body: {info, locs}} = await client.executeRename(location)

    if (!info.canRename) {
      return atom.notifications.addInfo("AtomTS: Rename not available at cursor location")
    }

    const newName = await deps.renameView.showRenameDialog({
      autoSelect: true,
      title: "Rename Variable",
      text: info.displayName,
      onValidate: (newText): string => {
        if (newText.replace(/\s/g, "") !== newText.trim()) {
            return "The new variable must not contain a space"
        }
        if (!newText.trim()) {
            return "If you want to abort : Press esc to exit"
        }
        return ""
      }
    })

    locs.map(async loc => {
      const {buffer, isOpen} = await deps.getBuffer(loc.file)
      buffer.transact(() => {
        for (const span of loc.locs) {
          buffer.setTextInRange(spanToRange(span), newName)
        }
      })
      if (!isOpen) {
        buffer.save()
        buffer.onDidSave(() => {
          buffer.destroy()
        })
      }
    })
  }
})
