import childProcess from 'child_process'
import fs from 'fs-extra'
import path from 'path'
import util from 'util'

const exec = util.promisify(childProcess.exec)

export async function concatFiles(filePathList, target) {
    const command = `cat ${filePathList.join(' ')} > ${target}`

    let { stderr } = await exec(command)
    stderr = stderr.trim()
    if (stderr) {
        throw new Error(stderr)
    }

    if (!await fs.pathExists(target)) {
        throw new Error('Something went wrong. Target file not found.')
    }

}
