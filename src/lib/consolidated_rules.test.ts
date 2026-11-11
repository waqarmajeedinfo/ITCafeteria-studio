import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildPracticalBlueprint,
  dryRunPracticalBlueprint,
  isConcreteTopic,
  buildYouTubeDescriptionFromBlueprint,
  runConsistencyGate
} from './practicalBlueprint';

import {
  validateAndRepairDialogue,
  validateStoryDialogues
} from './dialogueCompleteness';

import {
  checkHierarchicalDuplicate,
  inferProblemSignature,
  saveRejectedTopic,
  loadRejectedTopics,
  restoreRejectedTopic,
  isTopicBlocked,
  recordGeneratedStoryToMemory,
  loadDuplicateMemoryStories
} from './profileStore';

import {
  filterTagsByAspectRatio,
  loadAllChannels
} from './channelStore';

import { CHANNEL_PROFILES } from '../data/channelData';

test('A1 - Practical Truth: cleanmgr dry-run requires /sagerun after /sageset', () => {
  const incompleteBp = buildPracticalBlueprint({
    topic: 'C-Drive cleanmgr setup test',
    categoryName: 'PC & Windows Hacks',
    categoryId: 4,
    channelId: 'itcafeteria'
  });

  // Mutate steps to simulate broken single-phase command
  const brokenBp = {
    ...incompleteBp,
    steps: [
      {
        stepNumber: 1,
        actionTitle: 'Configure Cleanup',
        exactPathOrCommand: 'cleanmgr /sageset:1',
        uiLocation: 'Run dialog',
        expectedResult: 'Settings saved',
        visualDescription: 'Run dialog showing cleanmgr /sageset:1',
        dialogueFocus: 'Win+R mein cleanmgr /sageset:1 run karein aur space free ho chuka hai.'
      }
    ]
  };

  const reportBroken = dryRunPracticalBlueprint(brokenBp);
  assert.equal(reportBroken.passed, false, 'Single-phase sageset without sagerun must fail dry-run');
  assert.equal(reportBroken.commandPhasesComplete, false);
  assert.equal(reportBroken.claimsVerified, false);

  // Default complete blueprint has both sageset and sagerun
  const reportComplete = dryRunPracticalBlueprint(incompleteBp);
  assert.equal(reportComplete.commandPhasesComplete, true, 'Complete multi-phase pipeline must pass');
  assert.equal(reportComplete.passed, true);
});

test('A1 - Practical Truth: Invented numbers are caught and rejected', () => {
  const bp = buildPracticalBlueprint({
    topic: 'Windows 11 Speedup',
    categoryName: 'PC & Windows Hacks',
    categoryId: 4,
    channelId: 'itcafeteria'
  });

  const hypingBp = {
    ...bp,
    steps: [
      {
        stepNumber: 1,
        actionTitle: 'Fake speedup',
        exactPathOrCommand: 'cleanmgr',
        uiLocation: 'Run',
        expectedResult: 'System becomes 10x faster in 5 seconds guaranteed',
        visualDescription: 'Fake speedup visualization',
        dialogueFocus: 'Yeh command chalayein aur system 10x faster ho jayega!'
      }
    ]
  };

  const report = dryRunPracticalBlueprint(hypingBp);
  assert.equal(report.noInventedNumbers, false, 'Unbacked invented numbers must fail');
  assert.equal(report.passed, false);
});

test('A1 - Practical Truth: Unverified procedure displays warning banner and test checklist', () => {
  const unverified = buildPracticalBlueprint({
    topic: 'Hypothetical Untested Registry Hack',
    categoryName: 'PC & Windows Hacks',
    categoryId: 4,
    channelId: 'itcafeteria',
    rawSeedData: {
      tested_status: 'needs_manual_test',
      verified_how: 'needs manual test'
    }
  });

  assert.equal(unverified.verificationStatus, 'needs_verification');
  assert.equal(unverified.unverifiedWarning, 'NOT VERIFIED - test on a real PC before recording');
  assert.ok(Array.isArray(unverified.unverifiedTestChecklist) && unverified.unverifiedTestChecklist.length > 0);
});

test('A2 - Dialogue Completeness: Trailing connectors and unfinished endings are repaired', () => {
  // Test case ending with forbidden connector "kyunke..."
  const broken1 = 'Aksar users is setting ko off nahi karte kyunke...';
  const res1 = validateAndRepairDialogue(broken1, 9, 'closing');
  assert.equal(res1.valid, false);
  assert.equal(res1.repaired, true);
  assert.ok(!res1.dialogue.endsWith('kyunke.'), 'Dangling connector must be removed');
  assert.ok(/[.?!۔]$/.test(res1.dialogue), 'Must end with terminal punctuation');

  // Test case ending with "magar yaad rakhein ke..."
  const broken2 = 'C-Drive clean karne se pehle zaroori baat magar yaad rakhein ke...';
  const res2 = validateAndRepairDialogue(broken2, 10, 'teaser');
  assert.ok(!res2.dialogue.endsWith('ke...'));
  assert.ok(!res2.dialogue.endsWith('ke.'));
  assert.ok(/[.?!۔]$/.test(res2.dialogue));

  // Test typo fix
  const typoText = 'Tstep step mein Terminal ko open karein.';
  const resTypo = validateAndRepairDialogue(typoText, 3);
  assert.ok(resTypo.dialogue.includes('Step 3'));
  assert.ok(!resTypo.dialogue.includes('Tstep'));
  assert.ok(!resTypo.dialogue.includes('Teesra step'));
});

test('B1 & B4 - Duplicate Engine: SAME-PROBLEM verdict triggers when same problem & outcome are matched', () => {
  // Existing Story #23 in IT Cafeteria solves C-Drive storage space with cleanmgr
  const candidate = {
    title: 'Storage Sense Automated Disk Purge for Windows',
    channelId: 'itcafeteria',
    categoryId: 4,
    points: ['Auto delete temp files in Windows 11', 'Free up gigabytes of C-Drive space']
  };

  const result = checkHierarchicalDuplicate(candidate);
  assert.ok(
    result.verdict === 'SAME-PROBLEM' || result.verdict === 'exact',
    `Expected SAME-PROBLEM or exact verdict, got ${result.verdict}`
  );
  assert.ok(result.report, 'Duplicate report must exist');
  assert.notEqual(result.report?.verdict, 'PASSED');
  assert.ok(result.report?.reason.includes('SAME-PROBLEM') || result.report?.reason.includes('EXACT'));
});

test('B3 - Rejected Topics: Discarded topics are permanently blocked and restorable', () => {
  const channelId = 'test_channel_b3';
  const title = 'Windows 11 Battery Saver Trick';

  saveRejectedTopic(channelId, {
    title,
    reason: 'User discarded card'
  });

  const list = loadRejectedTopics(channelId);
  assert.ok(list.some(item => item.title === title), 'Topic must be in rejected topics list');

  const check = isTopicBlocked(channelId, title);
  assert.equal(check.blocked, true, 'Topic must be blocked from future suggestions');

  // Restore topic
  const targetId = list.find(item => item.title === title)?.id;
  assert.ok(targetId);
  restoreRejectedTopic(channelId, targetId!);

  const afterRestore = isTopicBlocked(channelId, title);
  assert.equal(afterRestore.blocked, false, 'Restored topic must no longer be blocked');
});

test('C - Description & Sources: Scene mapping uses real scene numbers and cleans category prefix', () => {
  const bp = buildPracticalBlueprint({
    topic: 'Windows Disk Cleanup',
    categoryName: '4. 4. PC & Windows Hacks',
    categoryId: 4,
    channelId: 'itcafeteria'
  });

  const desc = buildYouTubeDescriptionFromBlueprint({
    blueprint: bp,
    presenter: 'Waqar Majeed',
    channelName: 'IT Cafeteria',
    hook: 'Clean your C drive safely!',
    sceneMapping: { 1: 4, 2: 5, 3: 6, 4: 7 }
  });

  assert.ok(desc.includes('[Scene 4]'), 'Step 1 must reference real Scene 4');
  assert.ok(desc.includes('[Scene 5]'), 'Step 2 must reference real Scene 5');
  assert.ok(desc.includes('Category: 4. PC & Windows Hacks'), 'Category prefix must not repeat "4. 4."');
  assert.ok(!desc.includes('Category: 4. 4.'), 'Must not have duplicate number prefix');
  assert.ok(desc.includes('learn.microsoft.com/windows-server/administration/windows-commands/cleanmgr'), 'Must include specific deep official doc URL');
});

test('E - Character Tag Registry: Explicit aspect ratios filter correctly for 9:16 and 16:9', () => {
  const itTags = CHANNEL_PROFILES.itcafeteria.tags;

  const verticalTags = filterTagsByAspectRatio(itTags, '9:16');
  const widescreenTags = filterTagsByAspectRatio(itTags, '16:9');

  // 9:16 should contain WM25-1, 2, 3, 5, 6, 7, 8, 9 (8 tags), but NOT WM25-4
  const vValues = verticalTags.map(t => t.value);
  assert.ok(vValues.includes('@WM25-1'));
  assert.ok(vValues.includes('@WM25-2'));
  assert.ok(vValues.includes('@WM25-3'));
  assert.ok(vValues.includes('@WM25-5'));
  assert.ok(vValues.includes('@WM25-6'));
  assert.ok(vValues.includes('@WM25-7'));
  assert.ok(vValues.includes('@WM25-8'));
  assert.ok(vValues.includes('@WM25-9'));
  assert.equal(vValues.includes('@WM25-4'), false, '@WM25-4 is 16:9 lecture series only');

  // 16:9 should contain WM25-1, 2, 3, 4, 5 (5 tags), but NOT WM25-6, 7, 8, 9
  const wValues = widescreenTags.map(t => t.value);
  assert.ok(wValues.includes('@WM25-1'));
  assert.ok(wValues.includes('@WM25-2'));
  assert.ok(wValues.includes('@WM25-3'));
  assert.ok(wValues.includes('@WM25-4'));
  assert.ok(wValues.includes('@WM25-5'));
  assert.equal(wValues.includes('@WM25-6'), false, '@WM25-6 is 9:16 vertical only');
});
