import SwiftUI

struct SettingsView: View {
    var closeAction: () -> Void = {}
    @State private var activeSection = Sections.main
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            NavigationBar(
                leading: AnyView(Button(action: back) {
                    Image("NavIconBackDark").renderingMode(.original)
                }),
                center: AnyView(
                    Text({
                        switch activeSection {
                        case .main:
                            return "settings_title"
                        case .imprint:
                            return "settings_imprint_title"
                        case .privacyPolicy:
                            return "settings_privacy_policy_title"
                        case .termsOfUse:
                            return "settings_terms_of_use_title"
                        }
                    }())
                    .foregroundColor(Color.PolyPod.darkForeground)
                    .font(.custom("Jost-Medium", size: 16))
                    .kerning(-0.16)
                )
            )
            .background(Color.PolyPod.lightBackground)
            
            Divider()
            
            switch activeSection {
            case .main:
                MainSection(activeSection: $activeSection)
            case .imprint:
                HTMLView(text: "settings_imprint_text")
            case .privacyPolicy:
                HTMLView(text: "settings_privacy_policy_text")
            case .termsOfUse:
                HTMLView(text: "settings_terms_of_use_text")
            }
        }
    }
    
    private func back() {
        if activeSection == .main {
            closeAction()
            return
        }
        activeSection = .main
    }
}

private enum Sections {
    case main, imprint, privacyPolicy, termsOfUse
}

struct SettingsView_Previews: PreviewProvider {
    static var previews: some View {
        SettingsView()
    }
}

private struct MainSection: View {
    @Binding var activeSection: Sections
    @State private var showVersion = false
    
    private var displayVersion: String {
        guard let info = Bundle.main.infoDictionary else {
            return "Unknown"
        }
        let marketingVersion = info["CFBundleShortVersionString"] ?? "Unknown"
        let buildNumber = info["CFBundleVersion"] ?? "Unknown"
        return "\(marketingVersion) (\(buildNumber))"
    }
    
    var body: some View {
        List() {
            Section(header: SettingsHeader("settings_about_section")) {
                SettingsButton(
                    label: "settings_version",
                    action: { showVersion = true }
                )
                .alert(isPresented: $showVersion) {
                    Alert(
                        title: Text("settings_version"),
                        message: Text(displayVersion)
                    )
                }
            }
            .listRowInsets(
                EdgeInsets(top: 0, leading: 0, bottom: 0, trailing: 0)
            )
            
            Section(header: SettingsHeader("settings_legal_section")) {
                SettingsButton(
                    label: "settings_imprint_title",
                    action: { activeSection = .imprint }
                )
                SettingsButton(
                    label: "settings_privacy_policy_title",
                    action: { activeSection = .privacyPolicy }
                )
                SettingsButton(
                    label: "settings_terms_of_use_title",
                    action: { activeSection = .termsOfUse }
                )
            }
            .listRowInsets(
                EdgeInsets(top: 0, leading: 0, bottom: 0, trailing: 0)
            )
        }
    }
}

private struct SettingsHeader: View {
    private let text: LocalizedStringKey
    
    init(_ text: LocalizedStringKey) {
        self.text = text
    }
    
    var body: some View {
        Text(text)
            .foregroundColor(Color(fromHex: "#3E495B"))
            .font(.custom("Jost-Medium", size: 12))
            .kerning(-0.12)
            .frame(
                maxWidth: .infinity,
                maxHeight: .infinity,
                alignment: .leading
            )
            .padding(.leading, 32)
            .background(Color.PolyPod.semiLightBackground)
    }
}

private struct SettingsButton: View {
    let label: LocalizedStringKey
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(label)
                .foregroundColor(Color.PolyPod.darkForeground)
                .font(.custom("Jost-Regular", size: 18))
                .kerning(-0.18)
        }.padding(.leading, 32)
    }
}