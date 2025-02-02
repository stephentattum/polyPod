package coop.polypoly.polypod.polyOut

import android.content.Context
import android.database.Cursor
import android.net.Uri
import android.provider.OpenableColumns
import coop.polypoly.polypod.Preferences
import coop.polypoly.polypod.features.FeatureStorage
import coop.polypoly.polypod.polyNav.ZipTools
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.async
import kotlinx.coroutines.supervisorScope
import org.apache.commons.io.FileUtils
import java.io.File
import java.nio.ByteBuffer
import java.util.UUID
import kotlin.coroutines.EmptyCoroutineContext

open class PolyOut(
    val context: Context
) {
    private var readDirCache =
        mutableMapOf<String, Array<Map<String, String>>>()
    private var statCache = mutableMapOf<String, MutableMap<String, String>>()
    private val coroutineScope = CoroutineScope(EmptyCoroutineContext)

    companion object {
        val fsDomain = "polypod-assets.local"
        val fsPrefix = "https://$fsDomain/"
        val fsFilesRoot = "FeatureFiles"

        fun filesPath(context: Context) =
            context.filesDir.absolutePath + "/featureFiles"

        fun idToPath(id: String, context: Context): String {
            if (FeatureStorage.activeFeature == null) {
                throw Exception("Cannot execute without a feature")
            }
            val activeFeatureId = FeatureStorage.activeFeature!!.id
            val pureId = id
                // Previous polyPod builds used polypod:// URLs for files
                .removePrefix("polypod://")
                .removePrefix(fsPrefix)
                .removePrefix("$fsFilesRoot/")
                .removePrefix("$activeFeatureId/")

            return filesPath(context) + "/" + activeFeatureId +
                "/" + pureId
        }
    }

    private fun pathToId(path: File, context: Context): String {
        return fsPrefix + path.relativeTo(
            File(filesPath(context) + "/" + FeatureStorage.activeFeature?.id)
        ).path
    }

    open fun readFile(
        id: String
    ): ByteArray {
        if (id == "") {
            throw Exception("Empty path in PolyOut.readFile")
        }

        ZipTools.getEncryptedFile(context, idToPath(id, context)).let {
            it.openFileInput().use {
                return it.readBytes()
            }
        }
    }

    open suspend fun writeFile(path: String, data: ByteBuffer): Boolean {
        return true
    }

    open suspend fun stat(
        id: String
    ): MutableMap<String, String> {
        val fs = Preferences.getFileSystem(context)
        val result = mutableMapOf<String, String>()
        if (id == "") {
            return result
        }
        if (statCache.contains(id)) {
            return statCache.get(id)!!
        }
        val file = File(idToPath(id, context))
        if (!file.exists())
            throw Exception("stat: No such file '$id'")

        if (file.isDirectory()) {
            result["size"] = FileUtils.sizeOfDirectory(file).toString()
        } else {
            result["size"] = file.length().toString()
        }
        result["name"] = fs.get(id) ?: file.name
        result["time"] = (file.lastModified() / 1000).toString()
        result["id"] = id.removePrefix(fsPrefix).removePrefix(
            fsFilesRoot
        ).trimStart('/')
        statCache[id] = result
        return result
    }

    open suspend fun readDir(
        id: String
    ): Array<Map<String, String>> {
        val fs = Preferences.getFileSystem(context)
        if (id == "") {
            val newFs = fs.filter {
                File(idToPath(it.key, context)).exists()
            }
            Preferences.setFileSystem(context, newFs)
            return newFs.keys.map {
                mutableMapOf<String, String>(
                    "id" to it,
                    "path" to it.removePrefix(fsPrefix)
                )
            }.toTypedArray()
        }
        if (readDirCache.contains(id)) {
            return readDirCache.get(id)!!
        }
        val retList = mutableListOf<Map<String, String>>()

        val dir = File(idToPath(id, context))
        dir.walkTopDown().forEach {
            val idPath =
                "$fsFilesRoot/" + pathToId(it, context).removePrefix(fsPrefix)
            val relPath = it.relativeTo(dir).path
            val idMap =
                mutableMapOf<String, String>("id" to idPath, "path" to relPath)
            retList.add(idMap)
        }
        readDirCache[id] = retList.toTypedArray()
        return retList.toTypedArray()
    }

    open suspend fun importArchive(url: String): Uri? {
        val uri = Uri.parse(url)
        val contentResolver = context.contentResolver
        val cursor: Cursor? = contentResolver.query(
            uri, null, null, null, null, null
        )
        var fileName = ""
        cursor?.use {
            if (it.moveToFirst()) {
                fileName =
                    it.getString(
                        it.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                    )
            }
        }
        val retVal = supervisorScope {
            this.async {
                contentResolver?.openInputStream(uri).use { inputStream ->
                    if (inputStream == null) {
                        throw Error("File import error")
                    }
                    val newId = UUID.randomUUID().toString()
                    val fs = Preferences.getFileSystem(context).toMutableMap()
                    fs[fsPrefix + newId] = fileName
                    Preferences.setFileSystem(context, fs)
                    val featureId = FeatureStorage.activeFeature?.id
                        ?: throw Error("Cannot import for unknown feature")
                    val targetPath = "$featureId/$newId"
                    ZipTools.unzipAndEncrypt(inputStream, context, targetPath)
                }
            }
        }.await()
        return null // TODO: Return the expected value
    }

    open suspend fun removeArchive(id: String) {
        val fs = Preferences.getFileSystem(context).toMutableMap()
        File(idToPath(id, context)).deleteRecursively()
        fs.remove(id)
        Preferences.setFileSystem(context, fs)
    }
}
