import SwiftUI

class Feature {
    let path: URL
    let id: String
    let name: String
    let author: String?
    let description: String?
    let primaryColor: Color?
    let thumbnailColor: Color?
    let thumbnail: URL?
    private let links: [String: String]
    
    static func load(path: URL, languageCode: String?) -> Feature? {
        let manifest = readManifest(path)
        return Feature(
            path: path,
            manifest: manifest,
            languageCode: languageCode
        )
    }
    
    init(path: URL, manifest: FeatureManifest, languageCode: String?) {
        self.path = path
        let userLanguage = languageCode ?? "en"
        let translations = manifest.translations?[userLanguage]
        let id = path.lastPathComponent
        self.id = id
        name = translations?.name ?? manifest.name ?? id
        author = translations?.author ?? manifest.author
        description = translations?.description ?? manifest.description
        let primaryColor = parseColor(hexValue: translations?.primaryColor ?? manifest.primaryColor)
        self.primaryColor = primaryColor
        thumbnailColor = parseColor(hexValue: translations?.thumbnailColor ?? manifest.thumbnailColor) ?? primaryColor
        thumbnail = findThumbnail(
            featurePath: path,
            thumbnailPath: translations?.thumbnail ?? manifest.thumbnail
        )
        links = mergeLinks(
            original: manifest.links,
            translated: translations?.links
        )
    }
    
    func findUrl(target: String) -> String? {
        if let url = links[target] {
            return url
        }
        if links.values.contains(target) {
            return target
        }
        return nil
    }
}

private func readManifest(_ basePath: URL) -> FeatureManifest {
    let manifestPath = basePath.appendingPathComponent("manifest.json")
    if let manifest = FeatureManifest.load(path: manifestPath) {
        return manifest
    }
    Log.error("Failed to load feature manifest from: \(manifestPath)")
    return FeatureManifest(
        name: nil,
        author: nil,
        description: nil,
        thumbnail: nil,
        thumbnailColor: nil,
        primaryColor: nil,
        links: nil,
        translations: nil
    )
}

private func parseColor(hexValue: String?) -> Color? {
    guard let hexValue = hexValue else {
        return nil
    }
    return Color(fromHex: hexValue)
}

private func findThumbnail(featurePath: URL, thumbnailPath: String?) -> URL? {
    guard let thumbnailPath = thumbnailPath else {
        return nil
    }
    if thumbnailPath.isEmpty {
        return nil
    }
    let fullPath = featurePath.appendingPathComponent(thumbnailPath)
    if !FileManager.default.fileExists(atPath: fullPath.path) {
        Log.error("Error: Feature thumbnail at \(thumbnailPath) does not exist")
        return nil
    }
    return fullPath
}

private func mergeLinks(
    original: [String: String]?,
    translated: [String: String]?
) -> [String: String] {
    var links = original ?? [:]
    if let translated = translated {
        links = links.merging(translated) { (_, new) in new }
    }
    return links
}
