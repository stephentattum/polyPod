import Foundation
import Zip

class FeatureStorage {
    static let shared = FeatureStorage()
    
    lazy var featuresFileUrl: URL = {
        do {
            let documentsUrl = try FileManager.default.url(for: .documentDirectory, in: .userDomainMask, appropriateFor: nil, create: false)
            let featuresUrl = documentsUrl.appendingPathComponent("Features")
            return featuresUrl
        } catch {
            print(error.localizedDescription);
        }
        return URL(fileURLWithPath: "")
    }()
    
    lazy private var featureDirUrl: URL =
        URL(string: featuresFileUrl.path) ?? URL(fileURLWithPath: "")
    
    func cleanFeatures() {
        do {
            let documentsUrl = try! FileManager.default.url(for: .documentDirectory, in: .userDomainMask, appropriateFor: nil, create: false)
            let featuresUrl = documentsUrl.appendingPathComponent("Features")
            try FileManager.default.removeItem(at: featuresUrl)
        } catch {
            print(error.localizedDescription);
        }
    }
    
    func featuresList() -> [Feature] {
        var featuresList: [Feature] = []
        
        do {
            let directoryContents = try FileManager.default.contentsOfDirectory(at: featuresFileUrl, includingPropertiesForKeys: nil)
            let subDirs = directoryContents.filter{ $0.hasDirectoryPath }
            for featureDir in subDirs {
                if let feature = Feature.load(path: featureDir) {
                    featuresList.append(feature)
                }
            }
        } catch {
            print(error.localizedDescription)
        }
        
        return featuresList
    }
    
    func importFeatures() {
        createFeaturesFolder()
        importFeature("polyExplorer")
        importFeature("polyPreview")
    }
    
    private func createFeaturesFolder() {
        do {
            try FileManager.default.createDirectory(atPath: featureDirUrl.absoluteString, withIntermediateDirectories: true, attributes: nil)
        } catch {
            print(error.localizedDescription);
        }
    }
    
    private func importFeature(_ featureName: String) {
        let featureUrl = featureDirUrl.appendingPathComponent(featureName)
        if !FileManager.default.fileExists(atPath: featureUrl.absoluteString) {
            do {
                if let _ = Bundle.main.path(forResource: featureName, ofType: "zip") {
                    let filePath = Bundle.main.url(forResource: featureName, withExtension: "zip")!
                    let unzipDirectory = try Zip.quickUnzipFile(filePath)
                    try FileManager.default.moveItem(at: unzipDirectory, to: featuresFileUrl.appendingPathComponent(featureName))
                    try FileManager.default.copyBundleFile(forResource: "pod", ofType: "html", toDestinationUrl: featuresFileUrl.appendingPathComponent(featureName))
                    try FileManager.default.copyBundleFile(forResource: "polyLook", ofType: "css", toDestinationUrl: featuresFileUrl.appendingPathComponent(featureName))
                    try FileManager.default.copyBundleFile(forResource: "initIframe", ofType: "js", toDestinationUrl: featuresFileUrl.appendingPathComponent(featureName))
                    try importPodJs(toFeature: featureName, atUrl: featuresFileUrl)
                    print("Imported feature: ", featureName)
                } else {
                    print("Feature for import not found: ", featureName)
                }
            } catch {
                print(error.localizedDescription);
            }
        }
    }
    
    private func importPodJs(toFeature featureName: String, atUrl url: URL) throws {
        let fileManager = FileManager.default
        let resourceName = "pod"
        let resourceType = "js"
        let destinationUrl = featuresFileUrl.appendingPathComponent(featureName)
        
        if fileManager.hasBundleFile(
            forResource: resourceName,
            ofType: resourceType,
            atDestinationUrl: destinationUrl
        ) {
            print("""
                Ignoring \(resourceName).\(resourceType) provided by \
                \(featureName)
                """)
            try fileManager.removeBundleFile(
                forResource: resourceName,
                ofType: resourceType,
                atDestinationUrl: destinationUrl
            )
        }
        
        try fileManager.copyBundleFile(
            forResource: resourceName,
            ofType: resourceType,
            toDestinationUrl: destinationUrl
        )
    }
}
