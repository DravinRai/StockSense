const fs = require('fs');
const file = 'src/components/AIInsightsCard.tsx';
let content = fs.readFileSync(file, 'utf8');

const newStyles = `const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  cardContent: {
    width: "100%",
    paddingVertical: 16,
    gap: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: "#111111",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  updatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  updatingText: {
    color: "#111111",
    fontSize: 12,
    fontWeight: "600",
  },
  updatedText: {
    color: "#AAAAAA",
    fontSize: 12,
  },

  // Verdict Banner
  verdictBanner: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
  },
  verdictTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  verdictBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  verdictBadgeText: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
  },
  summaryText: {
    color: "#777777",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "400",
    flexShrink: 1,
  },

  // Signals Banner
  signalsRowBanner: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#F8F8F8",
    borderRadius: 4,
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  signalBannerItem: {
    alignItems: "center",
    gap: 4,
  },
  signalBannerLabel: {
    color: "#BBBBBB",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  signalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  signalDot: {
    minWidth: 8,
    height: 8,
    borderRadius: 4,
  },
  signalText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // Invest Box
  investBox: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: "#111111",
    backgroundColor: "#F8F8F8",
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  investTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  investDetailRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flex: 1,
    flexWrap: "wrap",
    gap: 4,
  },
  investAmount: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "600",
  },
  investEntry: {
    color: "#666666",
    fontSize: 12,
    fontWeight: "500",
  },

  // Section Card
  sectionCard: {
    backgroundColor: "#F8F8F8",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    width: "100%",
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  sectionTitle: {
    color: "#BBBBBB",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2.5,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  bodyText: {
    color: "#666666",
    fontSize: 13,
    lineHeight: 22,
  },

  // Price Grid
  priceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  priceBox: {
    width: "48%",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  priceBoxValue: {
    fontSize: 13,
    fontWeight: "bold",
  },
  priceBoxLabel: {
    color: "#888888",
    fontSize: 10,
    textAlign: "center",
  },

  // Key Factors
  factorRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#F0F0F0",
    gap: 4,
  },
  factorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  factorIcon: {
    fontSize: 14,
  },
  factorLabel: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "600",
  },
  factorDetail: {
    color: "#888888",
    fontSize: 12,
    lineHeight: 16,
    paddingLeft: 20,
  },

  // Lists
  listItem: {
    fontSize: 12.5,
    lineHeight: 18,
    paddingVertical: 2,
    color: "#666666",
  },

  // Error / Empty
  errorBox: {
    padding: 20,
    backgroundColor: "#F8F8F8",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderColor: "#C62828",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
  },
  errorIcon: { fontSize: 24 },
  errorText: { color: "#C62828", fontSize: 12.5, textAlign: "center", lineHeight: 18 },
  retryBtn: {
    marginTop: 8,
    backgroundColor: "#C62828",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryText: { color: "#FFFFFF", fontWeight: "700", fontSize: 12 },
  emptyBox: {
    padding: 20,
    alignItems: "center",
    marginHorizontal: 16,
  },
  emptyText: { color: "#666666", fontSize: 12.5, textAlign: "center" },

  // Disclaimer
  disclaimer: {
    color: "#CCCCCC",
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 24,
    lineHeight: 16,
    paddingHorizontal: 16,
  },

  // NEW STYLES
  keyInsightBox: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#1565C0",
    backgroundColor: "#F8F8F8",
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  keyInsightTitle: {
    color: "#111111",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 6,
  },
  keyInsightBody: {
    color: "#666666",
    fontSize: 13,
    lineHeight: 20,
  },

  bullsBearsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  bullsColumn: {
    flex: 1,
  },
  bearsColumn: {
    flex: 1,
  },
  bullsHeader: {
    color: "#2E7D32",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 8,
  },
  bearsHeader: {
    color: "#C62828",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 8,
  },
  bullBearItem: {
    flexDirection: "row",
    marginBottom: 6,
    gap: 6,
  },
  bullBearIcon: {
    fontSize: 12,
    marginTop: 2,
    color: "#AAAAAA",
  },
  bullText: {
    color: "#2E7D32",
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  bearText: {
    color: "#C62828",
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },

  scenarioCard: {
    width: 140,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  scenarioBear: {
    backgroundColor: "#FFF5F5",
    borderColor: "#C62828",
  },
  scenarioNeutral: {
    backgroundColor: "#F8F8F8",
    borderColor: "#CCCCCC",
  },
  scenarioBull: {
    backgroundColor: "#F0FFF4",
    borderColor: "#2E7D32",
  },
  scenarioCase: {
    color: "#AAAAAA",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  scenarioPrice: {
    color: "#111111",
    fontSize: 15,
    fontWeight: "800",
  },
  scenarioTrigger: {
    color: "#666666",
    fontSize: 11,
    lineHeight: 16,
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: "#F0F0F0",
    gap: 12,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionInfo: {
    flex: 1,
    gap: 2,
  },
  actionName: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "700",
  },
  actionReason: {
    color: "#666666",
    fontSize: 11,
    lineHeight: 16,
  },
  actionPrice: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "bold",
  },
  
  bottomLineText: {
    color: "#666666",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "500",
    fontStyle: "italic",
  },
});`;

content = content.replace(/const styles = StyleSheet\.create\(\{[\s\S]*\}\);/, newStyles);
fs.writeFileSync(file, content);
console.log('Styles updated.');
