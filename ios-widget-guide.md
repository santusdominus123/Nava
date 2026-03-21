# iOS Widget Setup Guide — Bible Guide AI

## Overview
This guide walks through adding a **Verse of the Day** widget to the iOS home screen using WidgetKit + SwiftUI.

---

## Step 1: Add Widget Extension Target in Xcode

1. Open `ios/BibleGuideAI.xcworkspace` in Xcode
2. File → New → Target → **Widget Extension**
3. Name: `VerseOfTheDayWidget`
4. Uncheck "Include Configuration Intent" (use static config)
5. Click Finish

## Step 2: Configure App Groups

Both the main app and widget need to share data:

1. Select main app target → Signing & Capabilities → + App Groups
2. Add group: `group.com.bibleguideai.app`
3. Select widget target → do the same
4. Both targets must have the same App Group enabled

## Step 3: Share Data via App Groups

In your React Native code, use `expo-dev-client` and a native module to write verse data to the shared container:

```swift
// ios/VerseOfTheDayWidget/SharedData.swift
import Foundation

struct VerseData: Codable {
    let reference: String
    let text: String
    let date: String
}

class SharedDataManager {
    static let shared = SharedDataManager()
    private let suiteName = "group.com.bibleguideai.app"

    func saveVerse(_ verse: VerseData) {
        let defaults = UserDefaults(suiteName: suiteName)
        let encoder = JSONEncoder()
        if let data = try? encoder.encode(verse) {
            defaults?.set(data, forKey: "todayVerse")
        }
    }

    func loadVerse() -> VerseData? {
        let defaults = UserDefaults(suiteName: suiteName)
        guard let data = defaults?.data(forKey: "todayVerse") else { return nil }
        return try? JSONDecoder().decode(VerseData.self, from: data)
    }
}
```

## Step 4: Widget Timeline Provider

```swift
// ios/VerseOfTheDayWidget/VerseProvider.swift
import WidgetKit

struct VerseEntry: TimelineEntry {
    let date: Date
    let reference: String
    let text: String
}

struct VerseProvider: TimelineProvider {
    func placeholder(in context: Context) -> VerseEntry {
        VerseEntry(date: Date(), reference: "Psalm 23:1", text: "The Lord is my shepherd; I shall not want.")
    }

    func getSnapshot(in context: Context, completion: @escaping (VerseEntry) -> Void) {
        let entry = loadEntry()
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<VerseEntry>) -> Void) {
        let entry = loadEntry()
        // Refresh at midnight
        let midnight = Calendar.current.startOfDay(for: Date()).addingTimeInterval(86400)
        let timeline = Timeline(entries: [entry], policy: .after(midnight))
        completion(timeline)
    }

    private func loadEntry() -> VerseEntry {
        if let verse = SharedDataManager.shared.loadVerse() {
            return VerseEntry(date: Date(), reference: verse.reference, text: verse.text)
        }
        return VerseEntry(date: Date(), reference: "Psalm 23:1", text: "The Lord is my shepherd; I shall not want.")
    }
}
```

## Step 5: Widget View

```swift
// ios/VerseOfTheDayWidget/VerseWidgetView.swift
import SwiftUI
import WidgetKit

struct VerseWidgetView: View {
    var entry: VerseProvider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        ZStack {
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.11, green: 0.24, blue: 0.35),
                    Color(red: 0.16, green: 0.33, blue: 0.48)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Image(systemName: "book.fill")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.7))
                    Text(entry.reference)
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.white.opacity(0.9))
                    Spacer()
                }

                Text(entry.text)
                    .font(family == .systemSmall ? .caption : .subheadline)
                    .foregroundColor(.white)
                    .lineLimit(family == .systemSmall ? 4 : 6)
                    .multilineTextAlignment(.leading)

                Spacer()

                Text("Bible Guide AI")
                    .font(.system(size: 9))
                    .foregroundColor(.white.opacity(0.4))
            }
            .padding()
        }
    }
}
```

## Step 6: Widget Configuration

```swift
// ios/VerseOfTheDayWidget/VerseOfTheDayWidget.swift
import WidgetKit
import SwiftUI

@main
struct VerseOfTheDayWidget: Widget {
    let kind: String = "VerseOfTheDayWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: VerseProvider()) { entry in
            VerseWidgetView(entry: entry)
        }
        .configurationDisplayName("Verse of the Day")
        .description("Daily Bible verse on your home screen")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
```

## Step 7: Expo Dev Client Setup

Since widgets require native code, you need `expo-dev-client`:

```bash
npx expo install expo-dev-client
npx expo prebuild
```

Then open `ios/BibleGuideAI.xcworkspace` in Xcode to add the widget target.

## Step 8: Trigger Widget Refresh from React Native

Use a native module bridge to call `WidgetCenter.shared.reloadAllTimelines()` whenever the verse updates:

```swift
// ios/BibleGuideAI/WidgetBridge.swift
import WidgetKit

@objc(WidgetBridge)
class WidgetBridge: NSObject {
    @objc func reloadWidget() {
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }
    }
}
```

---

## Notes
- Widgets require iOS 14+
- Test with Xcode Simulator → long press home screen → Add Widget
- The widget refreshes daily at midnight via the timeline policy
- Data is shared between app and widget using App Groups + UserDefaults
