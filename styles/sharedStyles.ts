// styles/sharedStyles.ts
import { StyleSheet, Platform } from 'react-native';
import { theme } from './theme';

export const sharedStyles = StyleSheet.create({
  // Layout Containers
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  contentContainer: {
    padding: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Forms
  form: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    flex: 1,
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  formContent: {
    gap: theme.spacing.md,
  },
  formActions: {
    padding: theme.spacing.md,
    paddingBottom: Platform.select({
      ios: theme.spacing.xl,
      android: theme.spacing.md,
    }),
    marginTop: 'auto',
  },
  inputGroup: {
    gap: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  // Search Styles
  searchContainer: {
    padding: theme.spacing.md,
    paddingBottom: 0,
  },
  searchInputWrapper: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  searchInput: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    paddingLeft: theme.spacing.xl * 2,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    height: 44,
  },
  searchIcon: {
    position: 'absolute',
    left: theme.spacing.lg,
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },

  // Date Picker Styles
  datePickerIOS: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    width: '100%',
    height: 180,
    overflow: 'hidden',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    minHeight: 52,  // Consistent height with other inputs
  },
  dateButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
  },

  // Cards
  card: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    margin: theme.spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  cardPressed: {
    opacity: 0.7,
  },

  // Buttons
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 48,
  },
  buttonText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.background.primary,
  },
  iconButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },

  // Text Styles
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.secondary,
  },
  bodyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
  },
  caption: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.tertiary,
  },

  // Lists
  list: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border.primary,
  },

  // Status Indicators
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBadge: {
    backgroundColor: theme.colors.status.success,
  },
  warningBadge: {
    backgroundColor: theme.colors.status.warning,
  },
  errorBadge: {
    backgroundColor: theme.colors.status.error,
  },

  // Filter Styles
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  filterButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background.secondary,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  filterButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.md,
  },
  filterButtonTextActive: {
    color: theme.colors.background.primary,
    fontWeight: '600',
  },

  // Ingredient Card Specific
  ingredientCard: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.lg,
    width: Platform.select({
      ios: '48%',  // Just slightly less than 50% to account for spacing
      android: '48%',
      default: 'calc(20% - 16px)'
    }),
    marginBottom: theme.spacing.md,
    height: 150,
    overflow: 'hidden',
    position: 'relative',
  },
  cardContentContainer: {
    flex: 1,
    padding: theme.spacing.md,
    paddingLeft: theme.spacing.lg,
    height: '100%',
    justifyContent: 'space-between',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  modalSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xl,
  },
  modalActions: {
    gap: theme.spacing.md,
  },

  // Platform Specific Styles
  webContainer: {
    maxWidth: Platform.select({ web: 1200, default: '100%' }),
    alignSelf: 'center',
    width: '100%',
  },

  // Grid Layouts
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: theme.spacing.sm,
  },

  // Empty States
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyStateTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    maxWidth: 400,
  },

  // Floating Action Button
  fab: {
    position: 'absolute',
    right: theme.spacing.xl,
    bottom: theme.spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});