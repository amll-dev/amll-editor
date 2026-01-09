import type { Translations } from '../i18n-types'

const consoleArt = `
╭──────────╮       ╶╴    ┌─╴  ╶─┐┌─┐    ┌─┐      ┌─────┐    ┌─┐┌─┐
│ ━━━━━━   │      ╱  ╲   │  ╲╱  ││ │    │ │      │ ┌───┘    │ │└─┘┌─┐
│   ━━━━━  │     ╱ ╱╲ ╲  │ ╷  ╷ ││ │    │ │      │ └──┐ ╭───┘ │┌─┐│ └┐╭─────╮╭───┐
│ |> ━━━ • │    ╱ ╶──╴ ╲ │ │╲╱│ ││ │    │ │      │ ┌──┘ │ ╭─╮ ││ ││ ┌┘│ ╭─╮ ││ ┌─┘
│   ━━━━━  │   ╱ ╱    ╲ ╲│ │  │ ││ └───┐│ └───┐  │ └───┐│ ╰─╯ ││ ││ └┐│ ╰─╯ ││ │
╰──────────╯   ─╴      ╶─└─┘  └─┘└─────┘└─────┘  └─────┘╰─────┘└─┘╰──┘╰─────╯└─┘

Welcome to AMLL Editor!

Project URL: https://github.com/Linho1219/AMLL-Editor
             Licensed under AGPLv3 only

Related projects: AMLL Homepage  https://amll.dev/
                  AMLL TTML DB   https://db.amll.dev/
                  AMLL TTML Tool https://tool.amll.dev/

Please note: DevTools, plugins, and user scripts may have a significant negative impact on performance.
`.trim()

const en = {
  editor: {
    context: {
      blank: {
        insertLine: 'Insert Line',
      },
      betweenLines: {
        insertLine: 'Insert Line Here',
      },
      line: {
        toggleDuet: 'Toggle Duet',
        toggleBackground: 'Toggle Background',
        insertLineAbove: 'Insert Line Above',
        insertLineBelow: 'Insert Line Below',
        duplicateLine: 'Duplicate Line',
        deleteLine: 'Delete Line',
      },
      syllable: {
        insertSylBefore: 'Insert Syllable Before',
        insertSylAfter: 'Insert Syllable After',
        breakLineAtSyl: 'Split Line Here',
        deleteSyl: 'Delete Syllable',
      },
    },
    dragGhost: {
      copyLine: 'Copy Line{{s}}',
      moveLine: 'Move Line{{s}}',
      copySyllable: 'Copy Syllable{{s}}',
      moveSyllable: 'Move Syllable{{s}}',
    },
    emptyTip: {
      title: {
        noLines: 'No Lyric Lines',
        allLinesEmpty: 'All Lines Are Empty',
      },
      detail: {
        goLoadOrCreate:
          'Use the “Open” menu to load content, or right-click empty area to insert a new line',
        goLoadOrEdit: 'Use the “Open” menu to load content, or edit in the content view',
      },
    },
    line: {
      index: 'Line Number',
      indexDbClickToToogleIgnore: 'Double-click to toggle timeline ignore status',
      bookmark: 'Bookmark',
      duet: 'Duet',
      background: 'Background',
      applyRomanToSyl: 'Apply to Syllable Romanization',
      generateRomanFromSyl: 'Generate from Syllable Romanization',
      startTime: 'Line Start Time',
      endTime: 'Line End Time',
      continueToNextLine: 'Extend End Time to Next Line',
      addSyllable: 'Add Syllable',
      fields: {
        trans: 'Line Translation',
        roman: 'Line Romanization',
      },
    },
    syllable: {
      startTime: 'Syllable Start Time',
      endTime: 'Syllable End Time',
    },
    preview: {
      reloadAmll: 'Reload AMLL',
    },
  },
  titlebar: {
    open: 'Open',
    openTip: 'Open File',
    openMenu: {
      project: 'Existing Project',
      ttml: 'TTML File',
      pasteTTML: 'Paste TTML',
      importFromText: 'Import Plain Text',
      importFromOtherFormats: 'Import from Other Formats',
      blank: 'New Blank Project',
    },
    save: 'Save',
    saveTip: 'Save File',
    saveMenu: {
      saveAs: 'Save As…',
      exportToProject: 'Export as Project File',
      exportToTTML: 'Export as TTML File',
      copyTTML: 'Copy TTML',
      exportToOtherFormats: 'Export to Other Formats',
    },
    preferences: 'Preferences',
    undo: 'Undo',
    redo: 'Redo',
    view: {
      content: 'Lyrics',
      timing: 'Timing',
      preview: 'Preview',
    },
    saveStatus: {
      compatMode: 'Compatibility Mode',
      permissionNotGranted: 'Write Permission Not Granted',
      savedAt: 'Saved at {0|time}',
    },
  },
  ribbon: {
    content: {
      groupLabel: 'Content',
      batchSyllabify: 'Batch Syllabify',
      batchSyllabifyDesc:
        'Open the batch syllabification sidebar to split multiple lyric lines into syllables.',
      metadata: 'Metadata',
      metadataDesc: 'Open the metadata sidebar to edit file metadata.',
      findReplace: 'Find & Replace',
      findReplaceDesc: 'Open the find and replace dialog to search or replace text in lyrics.',
    },
    lineAttr: {
      groupLabel: 'Line Attributes',
      duet: 'Duet Line',
      background: 'Background Line',
      ignoreInTiming: 'Ignore in Timeline',
      alwaysIgnoreBackground: 'Always Ignore Background Lines',
      startTime: 'Start Time',
      endTime: 'End Time',
      duration: 'Duration',
    },
    syllableAttr: {
      groupLabel: 'Syllable Attributes',
      startTime: 'Start Time',
      endTime: 'End Time',
      duration: 'Duration',
      placeholdingBeat: 'Placeholder Beat',
      applyToAllSameSyls: 'Apply to All Identical Syllables',
    },
    timeShift: {
      groupLabel: 'Time Shift',
      delayTest: 'Delay Test',
      delay: 'Delay',
      batchTimeShift: 'Batch Time Shift',
      batchTimeShiftDesc:
        'Open the batch time shift dialog to adjust timestamps of multiple syllables or lines.',
    },
    view: {
      groupLabel: 'View',
      enableSylRoman: 'Enable Syllable Romanization',
      scrollWithPlayback: 'Auto-Scroll with Playback',
      swapTranslateRoman: 'Swap Translation & Romanization Panels',
    },
    mark: {
      groupLabel: 'Markers',
      addBookmark: 'Add Bookmark',
      removeBookmark: 'Remove Bookmark',
      bookmarkDesc:
        'Add or remove bookmark on the selected line(s) or syllable(s). Bookmarks help mark important sections and are not exported to the lyric file.',
      addComment: 'Add Comment',
      removeAll: 'Remove All',
      removeAllDesc:
        'Remove all bookmarks and comments from the entire document. This action can be undone.',
    },
    performance: {
      groupLabel: 'Performance',
      usedHeapSize: 'Used',
      totalHeapSize: 'Allocated',
      frameRate: 'Frame Rate',
    },
  },
  sidebar: {
    syllabify: {
      header: 'Batch Syllabification',
      enginePlaceholder: 'Select Engine',
      engine: 'Syllabification Engine',
      recommended: 'Recommended',
      notRecommended: 'Not Recommended',
      expandDesc: 'Expand',
      collapseDesc: 'Collapse',
      customRules: 'Custom Rules',
      caseSensitive: 'Case Sensitive',
      originalTextPlaceholder: 'Original Text',
      addRule: 'Add Rule',
      sylDataLossWarn:
        'Existing syllable attributes will be lost. Durations will be linearly interpolated based on meaningful characters.',
      applyToSelectedLines: 'Apply to Selected Lines',
      applyToLinesAndAfter: 'Apply to Selected Lines and Following',
      applyToAll: 'Apply to All Lines',
    },
    metadata: {
      header: 'Metadata',
      templatePlaceholder: 'No Template',
      templateLabel: 'Metadata Field Template',
      templates: {
        lrc: {
          label: 'LRC Metadata Template',
          ti: 'Title',
          ar: 'Artist',
          al: 'Album',
          au: 'Composer',
          lr: 'Lyricist',
          by: 'Created By',
          re: 'Created With',
          len: 'Length',
          lenValidationMsg: 'Length format should be mm:ss or mm:ss.sss',
        },
        amll: {
          label: 'AMLL TTML Metadata Template',
          musicName: 'Song Title',
          artists: 'Artists',
          album: 'Album',
          ncmMusicId: 'NetEase Cloud Music ID',
          qqMusicId: 'QQ Music ID',
          spotifyId: 'Spotify ID',
          appleMusicId: 'Apple Music ID',
          isrc: 'ISRC',
          ttmlAuthorGithub: 'TTML Author GitHub UID',
          ttmlAuthorGithubLogin: 'TTML Author GitHub Username',
        },
      },
      documentBtn: 'Docs',
      addAllPresets: 'Add All Presets',
      keyPlaceholder: 'Key',
      clear: 'Clear',
      addField: 'Add Field',
    },
    preference: {
      header: 'Preferences',
      refreshToTakeEffect: 'Refresh the page to take effect',
      resetConfirm: {
        header: 'Reset All Settings',
        message:
          'Are you sure you want to reset all settings to their defaults? This action cannot be undone.',
        action: 'Reset',
      },
      groups: {
        data: 'Data',
        key: 'Keyboard',
        content: 'Content',
        timing: 'Timing',
        spectrogram: 'Spectrogram',
        compatibility: 'Compatibility',
        misc: 'Misc',
        about: 'About',
      },
      experimentalWarning: 'Experimental feature — may be unstable',
      items: {
        autoSaveEnabled: 'Auto Save',
        autoSaveEnabledDesc: 'Periodically save to filesystem after write permission is granted',
        autoSaveIntervalMinutes: 'Auto Save Interval',
        autoSaveIntervalMinutesDesc: 'Time interval for auto-save trigger (minutes)',
        maxUndoSteps: 'Maximum Undo Steps',
        maxUndoStepsDesc: 'Maximum number of operations that can be undone',
        packAudioToProject: 'Embed Audio in Project File',
        packAudioToProjectDesc: 'Pack audio file into the project file for archiving or sharing',
        ttmlAsDefault: 'Use TTML as Default Format',
        ttmlAsDefaultDesc: 'Use TTML instead of ALP format for new documents and saves by default',
        keyBinding: 'Key Bindings',
        keyBindingDesc: 'Open keyboard shortcut settings',
        keyBindingAction: 'Configure',
        macStyleShortcuts: 'macOS-style Shortcuts',
        macStyleShortcutsDesc: 'Display shortcuts using ⌘, ⌥ symbols etc.',
        audioSeekingStepMs: 'Seek Step Size',
        audioSeekingStepMsDesc: 'Time to jump forward/backward when using seek hotkeys (ms)',
        swapTranslateRoman: 'Swap Translation & Romanization Panels',
        swapTranslateRomanDesc:
          'Place romanization panel on the left in content view and affect search order',
        sylRomanEnabled: 'Enable Syllable Romanization',
        sylRomanEnabledDesc:
          'Show per-syllable romanization below syllable input and support find/replace',
        globalLatencyMs: 'Global Latency Compensation',
        globalLatencyMsDesc: 'Positive value = audio is delayed (ms)',
        alwaysIgnoreBackground: 'Always Ignore Background Lines',
        alwaysIgnoreBackgroundDesc: 'Always skip background lines in the timeline view',
        hideLineTiming: 'Hide Line Timestamps',
        hideLineTimingDesc: 'Automatically generate line timestamps from syllables',
        autoConnectLineTimes: 'Auto Connect Line Times',
        autoConnectLineTimesDesc: 'Automatically connect timestamps of adjacent lines when close',
        autoConnectThresholdMs: 'Auto Connect Threshold',
        autoConnectThresholdMsDesc: 'Maximum allowed gap between lines to auto-connect (ms)',
        scrollWithPlayback: 'Auto-Scroll with Playback',
        scrollWithPlaybackDesc: 'Timeline view automatically scrolls following playback position',
        compatibilityReport: 'Compatibility Report',
        compatibilityReportDesc: 'Open compatibility report window',
        compatibilityReportAction: 'Open',
        notifyCompatIssuesOnStartup: 'Notify Compatibility Issues on Startup',
        notifyCompatIssuesOnStartupDesc:
          'Show compatibility report dialog on launch if issues are detected',
        language: 'Language',
        languageDesc: 'Select the display language',
        resetAll: 'Reset All Settings',
        resetAllDesc: 'Restore all preferences to their default values',
        resetAllAction: 'Reset',
        aboutApp: 'About {0}',
        aboutAppDesc: 'Open software version information',
        aboutAppAction: 'About',
        githubRepo: 'GitHub Repository',
        githubRepoDesc: 'Visit the source code repository',
        githubRepoAction: 'Visit',
        sidebarWidth: 'Sidebar Width',
        sidebarWidthDesc: 'Default width of the sidebar (pixels)',
      },
    },
  },
  player: {
    chooseAudioFile: 'Choose Audio File',
    playOptions: 'Playback Options',
    volume: 'Volume',
    rate: 'Rate',
    resetTo: 'Reset to {0}',
    play: 'Play',
    pause: 'Pause',
    showSpectrogram: 'Show Spectrogram',
    hideSpectrogram: 'Hide Spectrogram',
    spectrogramUnavailable: 'Spectrogram Unavailable',
    allSupportedFormats: 'All Supported Audio Formats',
    failedToLoadAudio: {
      summary: 'Failed to Load Audio',
      detailAborted: 'File access denied by user or platform',
    },
    loadAudioSuccess: 'Audio Loaded Successfully',
  },
  spectrogram: {
    emptyTip: {
      title: 'No Audio Data',
      detail: 'Load an audio file to render the spectrogram',
    },
  },
  compat: {
    dialog: {
      header: 'Compatibility Report',
      notSupported: 'Not Supported',
      noReasonProvided: 'No reason provided',
      noImpactProvided: 'No potential issues described',
      dontCheckOnStartup: 'Do not check compatibility on startup',
      proceed: 'Continue',
    },
    sharedReasons: {
      insecureContext: 'Not running in a secure context. HTTPS or localhost access is required.',
    },
    clipboard: {
      name: 'Clipboard API',
      description:
        'The Clipboard API allows the web page to read from and write to the system clipboard with user permission.',
      impact: 'Copying and pasting TTML content will not be available.',
      apiNotSupported:
        'Clipboard-related APIs are not supported by this browser. Supported in Chromium 66+, Firefox 125+, Safari 13.1+.',
    },
    fileSystem: {
      name: 'File System API',
      description:
        'The File System API enables the web page to read and write files on disk with user permission, providing near-native file handling.',
      impact:
        'Files cannot be written directly — saves will use browser download instead. Auto-save functionality will be unavailable.',
      apiNotSupported:
        'File System-related APIs are not supported. Available in Chromium 86+. Firefox and Safari do not support it yet.',
    },
    mediaSession: {
      name: 'Media Session API',
      description:
        'The Media Session API allows the web page to customize media notifications and respond to media hardware key events.',
      impact:
        'Media playback cannot be controlled from system media controls (e.g. lock screen or notification center).',
      apiNotSupported:
        'Media Session-related APIs are not supported. Available in Chromium 72+, Firefox 82+, Safari 15+. Firefox on Android currently does not support it.',
    },
    sharedArrayBuffer: {
      name: 'SharedArrayBuffer',
      description:
        'SharedArrayBuffer enables efficient data sharing between multiple threads (required for high-performance features).',
      impact: 'Spectrogram visualization will not be available.',
      apiNotSupported:
        'SharedArrayBuffer is not supported. Available in Chromium 68+, Firefox 79+, Safari 15.2+.',
      coiRequired:
        'Cross-Origin Isolation (COOP/COEP) is not enabled. Contact the deployment provider to add the required HTTP headers, or adjust build options to enable Service Worker-based cross-origin isolation.',
      coiWorkaround:
        'Cross-Origin Isolation (COOP/COEP) is not enabled. This deployment attempts to enable it via Service Worker. If it doesn’t work, please try refreshing the page.',
    },
  },
  formats: {
    sharedReferences: {
      wikipedia: 'Wikipedia',
      officialDoc: 'Official Docs',
    },
    alp: {
      name: 'AMLL Editor Project',
      description:
        'AMLL Editor project file format. Embeds audio and lyric data, ideal for saving and sharing projects.',
    },
    ttml: {
      name: 'AMLL TTML',
      description:
        'Lyric format based on W3C TTML standard, following the AMLL TTML specification.',
    },
    lrc: {
      name: 'Standard LRC',
      description:
        'The most common lyric format. Supports line-level timestamps only, no per-syllable timing. For LRC-based extended formats, select the corresponding option.',
    },
    lrcA2: {
      name: 'LRC A2 Extension',
      description:
        'LRC-based extended format with line and per-syllable timestamps. Originally proposed by A2 Media Player.',
    },
    yrc: {
      name: 'NetEase Cloud Lyrics (YRC)',
      description:
        'NetEase Cloud Music proprietary per-syllable lyric format. Supports line and syllable timestamps.',
    },
    qrc: {
      name: 'QQ Music Lyrics (QRC)',
      description:
        'QQ Music proprietary per-syllable lyric format. Supports line and syllable timestamps.',
    },
    spl: {
      name: 'Salt Player Lyrics (SPL)',
      description:
        'Salt Player proprietary format based on LRC extensions. Supports line/syllable timestamps and translations. Complex rules may limit full compatibility.',
    },
  },
  file: {
    allSupportedFormats: 'All Supported Formats',
    untitled: 'Untitled',
    loaded: 'File loaded successfully',
    failedToReadErr: {
      summary: 'Failed to read file',
      typeNotSupported: 'Unsupported file type: {0}',
      noHandleProvided: 'No file handle provided',
      unableToGetFile: 'Unable to access provided file',
    },
    dataDropConfirm: {
      header: 'Unsaved changes',
      message: 'Continuing will discard all unsaved changes. This action cannot be undone.',
      acceptLabel: 'Continue Anyway',
    },
    loadFileSuccess: 'File loaded successfully',
    failedToLoadErr: {
      summary: 'Failed to load file',
      detailAborted: 'File access denied by user or platform',
    },
    clipboardIsEmptyErr: 'Clipboard is empty',
    failedToPasteTTML: 'Failed to import TTML from clipboard',
    failedToCopyTTML: 'Failed to copy TTML to clipboard',
    pasteTTMLSuccess: 'TTML imported from clipboard successfully',
    copyTTMLSuccess: 'TTML copied to clipboard successfully',
    newBlankProjectSuccess: 'Blank project created successfully',
    failedBlankProject: {
      summary: 'Failed to create blank project',
      detailAborted: 'Operation aborted by user',
    },
    saveFileSuccess: 'File saved successfully',
    failedToSaveErr: {
      summary: 'Failed to save file',
      detailAborted: 'File write denied by user or platform',
    },
    saveAsSuccess: 'File saved as… successfully',
    failedToSaveAsErr: {
      summary: 'Failed to save file as…',
      detailAborted: 'File write denied by user or platform',
    },
  },
  find: {
    header: 'Find & Replace',
    mode: {
      find: 'Find',
      replace: 'Replace',
    },
    placeholder: {
      find: 'Find what',
      replace: 'Replace with',
    },
    moreOptionSwitch: 'More Options',
    optionsHeader: 'Match Options',
    options: {
      caseSensitive: 'Case Sensitive',
      wholeWord: 'Whole Word',
      wholeField: 'Whole Field',
      crossSyl: 'Cross-Syllable Match',
      useRegex: 'Use Regular Expression',
      loopSearch: 'Wrap Around',
    },
    scopeHeader: 'Search Scope',
    scope: {
      sylContent: 'Syllable Content',
      sylRoman: 'Syllable Romanization',
      trans: 'Translation',
      roman: 'Romanization',
      lineRoman: 'Line Romanization',
    },
    actions: {
      replace: 'Replace',
      replaceAll: 'Replace All',
      findPrev: 'Find Previous',
      findNext: 'Find Next',
    },
    infLoopErr: {
      summary: 'Search Failed',
      detail: 'Infinite loop detected. Please report this issue.',
    },
    noResultWarn: {
      summary: 'No Results Found',
      detailEmpty: 'The selected scope is empty.',
      detailNoMatch: 'Reached the end of document without finding any matches.',
      detailNoMatchEnd:
        'Reached the end of document — no more matches.\nEnable "Wrap Around" to continue searching from the beginning.',
    },
    replaceSuccess: {
      summary: 'Replacement Complete',
      detail: 'Replaced {0} occurrence{{s}}.',
    },
  },
  hotkey: {
    dialogHeader: 'Key Bindings',
    notBinded: 'Not Bound',
    btns: {
      add: 'Add',
      del: 'Remove',
      reset: 'Reset to Defaults',
    },
    groupTitles: {
      file: 'File Operations',
      view: 'View & Interface',
      editing: 'Editing',
      timing: 'Timing',
      audio: 'Audio Control',
    },
    commands: {
      open: 'Open',
      save: 'Save',
      saveAs: 'Save As',

      new: 'New Blank Project',
      exportToClipboard: 'Export to Clipboard',
      importFromClipboard: 'Import from Clipboard',

      switchToContent: 'Switch to Lyrics View',
      switchToTiming: 'Switch to Timing View',
      switchToPreview: 'Switch to Preview',

      preferences: 'Preferences',
      batchSplitText: 'Batch Syllabify',
      metadata: 'Metadata',

      batchTimeShift: 'Batch Time Shift',
      undo: 'Undo',
      redo: 'Redo',
      bookmark: 'Toggle Bookmark',
      find: 'Find',
      replace: 'Replace',
      delete: 'Delete',
      selectAllLines: 'Select All Lines',
      selectAllSyls: 'Select All Syllables',
      breakLine: 'Split Line',
      duet: 'Toggle Duet Line',
      background: 'Toggle Background Line',

      goPrevLine: 'Previous Line',
      goPrevSyl: 'Previous Syllable',
      goPrevSylnPlay: 'Previous Syllable & Play',
      goNextLine: 'Next Line',
      goNextSyl: 'Next Syllable',
      goNextSylnPlay: 'Next Syllable & Play',
      playCurrSyl: 'Play Current Syllable',
      markBegin: 'Set Start Time',
      markEndBegin: 'Set End & Next Start (Continue)',
      markEnd: 'Set End Time',

      chooseMedia: 'Select Media',
      seekBackward: 'Seek Backward',
      volumeUp: 'Volume Up',
      playPauseAudio: 'Play / Pause',
      seekForward: 'Seek Forward',
      volumeDown: 'Volume Down',
    },
    keyNames: {
      space: 'Space',
    },
  },
  syllabify: {
    engines: {
      basic: {
        name: 'Basic Syllabification',
        description:
          'Splits Western words by whitespace; splits CJK text character-by-character. Custom rules are applied to the resulting tokens (pre-split words are not merged).',
      },
      jaBasic: {
        name: 'Japanese Basic Syllabification',
        description:
          'Special handling for Japanese small kana (ゃゅょ etc.). Custom rules take priority; remaining parts are split according to built-in rules.',
      },
      prosodic: {
        name: 'Prosodic English Syllabification',
        description:
          'Uses SUBTLEXus corpus. Syllables are derived from CMUdict via Prosodic, then matched back to spelling to build a dictionary. High-frequency words are manually verified. Falls back to Compromise for unmatched words.',
      },
      silabeador: {
        name: 'Silabeador Spanish Syllabification',
        description:
          'Orthographic Spanish syllabification provided by the Silabeador library, with built-in exception table. Tolerates uncommon or non-standard diacritics and consonant clusters.',
      },
      compromise: {
        name: 'Compromise English Syllabification',
        description: 'Orthographic English syllable splitting provided by the Compromise library.',
      },
      syllabifyFr: {
        name: 'Syllabify-fr French Syllabification',
        description: 'Orthographic French syllable splitting provided by the Syllabify-fr library.',
      },
      syllabify: {
        name: 'Syllabify Russian Syllabification',
        description: 'Orthographic Russian syllable splitting provided by the Syllabify library.',
      },
    },
  },
  components: {
    confirmDialog: {
      cancel: 'Cancel',
      continue: 'Continue',
    },
    emptyTipDefault: 'No content to display in the current view',
  },
  importFromText: {
    header: 'Import from Plain Text',
    modes: {
      separate: 'Separate Inputs',
      separateDesc:
        'Input original lyrics, translation, and romanization in separate text areas. Lines at the same position form a group.',
      interleaved: 'Interleaved Lines',
      interleavedDesc:
        'Original lyrics mixed with translation and romanization lines in alternating order. Consecutive lines form a group.',
    },
    fields: {
      original: 'Original Lyrics',
      keepCurrentLinesTip: '(Keep existing lines)',
      trans: 'Translation',
      roman: 'Romanization',
      atLeastProvideOne: 'Provide at least one field',
    },
    toolBtns: {
      removeTimestamps: 'Remove Timestamps',
      normalizeSpaces: 'Normalize Spaces',
      capitalizeFirstLetter: 'Capitalize First Letter',
      removeTrailingPunc: 'Remove Trailing Punctuation',
    },
    lineOrder: {
      header: 'Line Order Configuration',
      cycleLengthHint: 'Current cycle contains {0} lines',
      original: 'Original Line',
      trans: 'Translation Line',
      roman: 'Romanization Line',
      emptyLineCount: 'Empty Lines Between Groups',
    },
    cancel: 'Cancel',
    action: 'Import',
  },
  importFromOtherFormats: {
    header: 'Import from Other Lyric Formats',
    noDescriptionProvided: 'No description provided',
    showExamples: 'Show Examples',
    fromFile: 'Open from File',
    exampleLabel: 'Format Example',
    cancel: 'Cancel',
    import: 'Import',
    requireSelectFormat: 'Please select a format on the left',
  },
  about: {
    header: 'About',
    version: 'Version',
    description:
      'Open-source per-syllable lyric editor built with Vue. Works with the AMLL ecosystem and aims to become the successor to AMLL TTML Tool.\nDevelopment takes effort — consider giving a free star!',
    githubBtn: 'GitHub Repository',
    detailBtn: 'Show Details',
    detail: {
      version: 'Version',
      channel: 'Build Channel',
      hash: 'Commit Hash',
      buildTime: 'Build Time',
      amllCoreVersion: 'AMLL Core Version',
      amllVueVersion: 'AMLL Vue Version',
      notSpecified: 'Not specified',
    },
  },
  batchTimeShift: {
    header: 'Batch Time Shift',
    signHint: 'Positive = delay, Negative = advance',
    applyToSyl: 'Apply to Selected Syllables',
    applyToLine: 'Apply to Selected Lines',
    applyToAll: 'Apply to All',
  },
  consoleArt,
} as const satisfies Translations

export default en
