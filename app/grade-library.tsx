import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { GRADE_CONTENT_GUIDES, type GradeGuide } from "@/lib/grade-content";
import { DEFAULT_PROGRESS, getActiveProfile, type LearningProgress } from "@/lib/learning-progress";
import { getMaterialBatchBadge, getMaterialBatchCount, getMaterialWordBatch, getNextMaterialBatchIndex, MATERIAL_WORD_BATCH_SIZE } from "@/lib/material-learning";
import { getUploadedWordsForLevel } from "@/lib/uploaded-vocabulary";
import { ScreenContainer } from "@/components/screen-container";

export default function GradeLibraryScreen() {
  const router = useRouter();
  const [expandedGrade, setExpandedGrade] = useState("G1");
  const [progress, setProgress] = useState<LearningProgress>(DEFAULT_PROGRESS);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getActiveProfile().then((profile) => {
        if (active) setProgress(profile.progress);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <FlatList
        data={GRADE_CONTENT_GUIDES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <View style={styles.top}>
              <Pressable accessibilityRole="button" accessibilityLabel="返回上一页" onPress={() => router.back()} style={styles.back}>
                <Text style={styles.backText}>‹</Text>
              </Pressable>
              <Text style={styles.navTitle}>分级内容馆</Text>
              <View style={styles.space} />
            </View>
            <View style={styles.hero}>
              <Text style={styles.heroKicker}>G1—G7 学习路线</Text>
              <Text style={styles.heroTitle}>每个年级，学适合自己的英语</Text>
              <Text style={styles.heroBody}>启蒙阶段多听多说，中高年级逐步加入拼写、语法、阅读和表达。选择年级，看看对应的主题与练习方式。</Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <GradeCard
            guide={item}
            progress={progress}
            expanded={expandedGrade === item.id}
            onToggle={() => setExpandedGrade(expandedGrade === item.id ? "" : item.id)}
          />
        )}
      />
    </ScreenContainer>
  );
}

function GradeCard({ guide, progress, expanded, onToggle }: { guide: GradeGuide; progress: LearningProgress; expanded: boolean; onToggle: () => void }) {
  const router = useRouter();
  const levelId = guide.id.replace("G", "L");
  const additions = getUploadedWordsForLevel(levelId);
  const previewAdditions = additions.slice(0, 8);
  const batchCount = getMaterialBatchCount(additions.length);
  const completedBatchCount = Array.from({ length: batchCount }, (_, batchIndex) => getMaterialBatchBadge(levelId, batchIndex)).filter((badge) => Boolean(progress.materialBatchBadges[badge.id])).length;
  const nextBatchIndex = getNextMaterialBatchIndex(levelId, additions.length, progress.materialBatchBadges);
  const nextBatchWords = getMaterialWordBatch(additions, nextBatchIndex).length;
  const allBatchesComplete = additions.length > 0 && completedBatchCount === batchCount;
  const practiceButtonLabel = allBatchesComplete
    ? `从第1组复练（共${batchCount}组）`
    : nextBatchIndex === 0
      ? `开始第1组（共${batchCount}组）`
      : `继续第${nextBatchIndex + 1}组（共${batchCount}组）`;
  const startPractice = (batchIndex: number) => router.push({ pathname: "/material-practice/[level]", params: { level: levelId, batch: String(batchIndex) } } as never);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${guide.title}内容${expanded ? "已展开" : "已收起"}`}
      onPress={onToggle}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.cardTop}>
        <View style={[styles.gradeBadge, { backgroundColor: guide.color }]}><Text style={styles.gradeId}>{guide.id}</Text></View>
        <View style={styles.cardHeadCopy}><Text style={styles.gradeTitle}>{guide.title}</Text><Text style={styles.stage}>{guide.stage}</Text></View>
        <Text style={styles.chevron}>{expanded ? "⌃" : "›"}</Text>
      </View>
      <Text style={styles.focus}>{guide.focus}</Text>
      {expanded ? (
        <>
          <View style={styles.moduleList}>
            {guide.modules.map((module) => (
              <View key={module.title} style={styles.module}>
                <View style={styles.moduleMark}><Text style={styles.moduleMarkText}>✓</Text></View>
                <View style={styles.moduleCopy}>
                  <Text style={styles.moduleTitle}>{module.title}</Text>
                  <Text style={styles.moduleTopics}>{module.topics}</Text>
                  <Text style={styles.practice}>推荐：{module.practice}</Text>
                </View>
              </View>
            ))}
          </View>
          {additions.length ? (
            <View style={styles.additionBox}>
              <Text style={styles.additionTitle}>新融合词 · {additions.length} 个</Text>
              <Text style={styles.additionBody}>来自上传材料，已跳过已有词。可在词义、{guide.id === "G1" || guide.id === "G2" ? "听辨" : "字母补全"}、语境和跟读中练习。</Text>
              <View style={styles.wordChips}>
                {previewAdditions.map((item) => (
                  <View key={item.id} style={styles.wordChip}><Text style={styles.wordText}>{item.word}</Text><Text style={styles.meaningText}>{item.meaning}</Text></View>
                ))}
              </View>
              <View style={styles.batchSummary}>
                <Text style={styles.batchSummaryTitle}>全部新词练习路线</Text>
                <Text style={styles.batchSummaryBody}>共 {additions.length} 个新词，分 {batchCount} 组练习，每组最多 {MATERIAL_WORD_BATCH_SIZE} 词。</Text>
                <Text style={styles.batchSummaryProgress}>
                  {allBatchesComplete
                    ? `已完成全部 ${batchCount} 组，现在可从第1组复练。`
                    : `已完成 ${completedBatchCount}/${batchCount} 组；下一组是第 ${nextBatchIndex + 1} 组（${nextBatchWords} 词）。`}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${practiceButtonLabel} ${guide.title}新增词`}
                onPress={(event) => { event.stopPropagation(); startPractice(nextBatchIndex); }}
                style={[styles.practiceNewButton, { backgroundColor: guide.color }]}
              >
                <Text style={styles.practiceNewText}>{practiceButtonLabel}</Text>
              </Pressable>
              {nextBatchIndex > 0 && !allBatchesComplete ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`从第一组重新开始练习${guide.title}新增词`}
                  onPress={(event) => { event.stopPropagation(); startPractice(0); }}
                  style={styles.restartPracticeButton}
                >
                  <Text style={styles.restartPracticeText}>从第1组重新开始</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </>
      ) : <Text style={styles.expandHint}>点击查看本年级的主题与训练方式</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 42, gap: 13, backgroundColor: "#FFF9F0" },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 5 },
  back: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EEE7DE", alignItems: "center", justifyContent: "center" },
  backText: { color: "#6E665E", fontSize: 31, marginTop: -4 },
  navTitle: { color: "#2E2A25", fontSize: 16, fontWeight: "900" },
  space: { width: 38 },
  hero: { marginTop: 13, padding: 20, borderRadius: 25, backgroundColor: "#FFF0D7" },
  heroKicker: { color: "#B4621E", fontSize: 12, fontWeight: "900" },
  heroTitle: { color: "#553718", fontSize: 22, lineHeight: 29, fontWeight: "900", marginTop: 6 },
  heroBody: { color: "#805F3C", fontSize: 13, lineHeight: 20, marginTop: 8 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 22, borderWidth: 1, borderColor: "#EEE7DE", padding: 16 },
  cardTop: { flexDirection: "row", alignItems: "center" },
  gradeBadge: { width: 47, height: 47, borderRadius: 16, alignItems: "center", justifyContent: "center", marginRight: 12 },
  gradeId: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  cardHeadCopy: { flex: 1 },
  gradeTitle: { color: "#2E2A25", fontSize: 16, fontWeight: "900" },
  stage: { color: "#82796F", fontSize: 12, marginTop: 3, fontWeight: "700" },
  chevron: { color: "#847A71", fontSize: 25, marginLeft: 8 },
  focus: { color: "#5F574F", fontSize: 13, lineHeight: 19, marginTop: 12 },
  expandHint: { color: "#A07849", fontSize: 12, fontWeight: "800", marginTop: 11 },
  moduleList: { borderTopWidth: 1, borderTopColor: "#F0EAE1", marginTop: 14, paddingTop: 4, gap: 3 },
  module: { flexDirection: "row", paddingVertical: 10 },
  moduleMark: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#E3F7E8", alignItems: "center", justifyContent: "center", marginRight: 10, marginTop: 1 },
  moduleMarkText: { color: "#2D8441", fontSize: 11, fontWeight: "900" },
  moduleCopy: { flex: 1 },
  moduleTitle: { color: "#463F39", fontSize: 14, fontWeight: "900" },
  moduleTopics: { color: "#7C736A", fontSize: 12, lineHeight: 18, marginTop: 3 },
  practice: { color: "#6D5DB6", fontSize: 12, fontWeight: "800", marginTop: 4 },
  additionBox: { marginTop: 12, borderRadius: 16, padding: 13, backgroundColor: "#F5F2FF" },
  additionTitle: { color: "#5D58B5", fontSize: 13, fontWeight: "900" },
  additionBody: { color: "#746F9A", fontSize: 11, lineHeight: 17, marginTop: 4 },
  wordChips: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 10 },
  wordChip: { backgroundColor: "#FFFFFF", borderRadius: 10, paddingVertical: 6, paddingHorizontal: 8 },
  wordText: { color: "#4E488D", fontSize: 11, fontWeight: "900" },
  meaningText: { color: "#817AA5", fontSize: 10, marginTop: 2 },
  batchSummary: { marginTop: 11, borderRadius: 11, padding: 10, backgroundColor: "#FFFFFF" },
  batchSummaryTitle: { color: "#5D58B5", fontSize: 11, fontWeight: "900" },
  batchSummaryBody: { color: "#746F9A", fontSize: 11, lineHeight: 17, marginTop: 3, fontWeight: "700" },
  batchSummaryProgress: { color: "#A05B28", fontSize: 10, lineHeight: 16, marginTop: 5, fontWeight: "900" },
  practiceNewButton: { alignSelf: "flex-start", borderRadius: 11, paddingHorizontal: 12, paddingVertical: 9, marginTop: 11 },
  practiceNewText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  restartPracticeButton: { alignSelf: "flex-start", borderRadius: 11, borderWidth: 1, borderColor: "#B8B2D8", paddingHorizontal: 12, paddingVertical: 8, marginTop: 8 },
  restartPracticeText: { color: "#625CAD", fontSize: 11, fontWeight: "900" },
});
