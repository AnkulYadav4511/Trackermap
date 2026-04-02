import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, StyleSheet,
    ActivityIndicator, RefreshControl, TouchableOpacity,
    Alert, Modal, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as XLSX from 'xlsx';
import { authService, BASE_URL as API_URL } from '../../services/api';

interface NoteItem {
    _id?: string;
    className?: string;
    subjectsTaught?: string;
    directorName?: string;
    directorNumber?: string;
    contactPersonName?: string;
    contactPersonNumber?: string;
    address?: string;
    studentCount?: number;
    classCount?: number;
    remark?: string;
    remarks?: string;
    [key: string]: any;
}

interface ShiftItem {
    _id: string;
    date: string;
    loginTime: string;
    logoutTime: string;
    path?: any[];
    notes?: NoteItem[];
    dayNotes?: NoteItem[];
}

const getShiftNotes = (shift: ShiftItem): NoteItem[] => {
    if (shift.notes && shift.notes.length > 0)      return shift.notes;
    if (shift.dayNotes && shift.dayNotes.length > 0) return shift.dayNotes;
    return [];
};

const resolveNote = (n: NoteItem) => ({
    className:    n.className      || '',
    subjects:     n.subjectsTaught || '',
    director:     n.directorName   || '',
    phone:        n.directorNumber || n.contactPersonNumber || '',
    address:      n.address        || '',
    studentCount: n.studentCount   ?? 0,
    classCount:   n.classCount     ?? 0,
    remark:       n.remark || n.remarks || '',
});

const parseShiftDate = (dateStr: string): Date => {
    const parts = dateStr.replace(/-/g, '/').split('/');
    if (parts.length === 3) {
        const [d, m, y] = parts;
        return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    }
    return new Date(dateStr);
};

const formatDisplayDate = (date: Date): string =>
    `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

const isBetween = (shiftDateStr: string, start: Date, end: Date): boolean => {
    const d = parseShiftDate(shiftDateStr);
    const s = new Date(start); s.setHours(0, 0, 0, 0);
    const e = new Date(end);   e.setHours(23, 59, 59, 999);
    return d >= s && d <= e;
};

const isSameDay = (shiftDateStr: string, target: Date): boolean => {
    const d = parseShiftDate(shiftDateStr);
    return (
        d.getDate()     === target.getDate() &&
        d.getMonth()    === target.getMonth() &&
        d.getFullYear() === target.getFullYear()
    );
};

const fetchShiftNotes = async (shiftId: string): Promise<NoteItem[]> => {
    try {
        const url = `${API_URL}/shift-details/${shiftId}`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        return data.notes || [];
    } catch (err) {
        console.error(`Failed to fetch notes for shift ${shiftId}:`, err);
        return [];
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  EXCEL BUILDER
// ─────────────────────────────────────────────────────────────────────────────

const buildExcel = async (
    workerName: string,
    shiftsToExport: ShiftItem[],
    fileName: string,
    onProgress?: (msg: string) => void
): Promise<string | null> => {
    try {
        const dataRows: any[][] = [];

        for (let i = 0; i < shiftsToExport.length; i++) {
            const shift = shiftsToExport[i];
            onProgress?.(`Fetching shift ${i + 1} of ${shiftsToExport.length}…`);

            let notes = getShiftNotes(shift);
            if (notes.length === 0) notes = await fetchShiftNotes(shift._id);
            if (notes.length === 0) continue;

            for (const note of notes) {
                const r = resolveNote(note);
                dataRows.push([
                    shift.date, r.className, r.subjects, r.director,
                    r.phone, r.address, r.studentCount, r.classCount, r.remark,
                ]);
            }
        }

        if (dataRows.length === 0) return null;

        // Row 1 — worker name merged title
        const titleRow: any[] = Array(9).fill('');
        titleRow[3] = workerName;

        // Row 2 — column headers
        const headerRow = [
            'Date', 'Class Name', 'Subjects Taught', 'Director',
            'Phone', 'Address', 'Student Count', 'Class Count', 'Remark',
        ];

        const wsData = [titleRow, headerRow, ...dataRows];
        const ws: any = XLSX.utils.aoa_to_sheet(wsData);

        // ── Column widths (A4 landscape, slim to fit one page) ──
        ws['!cols'] = [
            { wch: 10 }, // Date
            { wch: 16 }, // Class Name
            { wch: 14 }, // Subjects Taught
            { wch: 14 }, // Director
            { wch: 12 }, // Phone
            { wch: 20 }, // Address
            { wch: 10 }, // Student Count
            { wch: 9  }, // Class Count
            { wch: 16 }, // Remark
        ];

        // ── Row heights ──
        ws['!rows'] = [
            { hpt: 30 },
            { hpt: 28 },
            ...dataRows.map(() => ({ hpt: 36 })),
        ];

        // ── Border style ──
        const borderStyle = {
            top:    { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left:   { style: 'thin', color: { rgb: '000000' } },
            right:  { style: 'thin', color: { rgb: '000000' } },
        };

        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

        // ── Borders on all cells except title row ──
        for (let R = range.s.r; R <= range.e.r; R++) {
            for (let C = range.s.c; C <= range.e.c; C++) {
                const addr = XLSX.utils.encode_cell({ r: R, c: C });
                if (R === 0) continue; // skip title row
                if (!ws[addr]) ws[addr] = { t: 's', v: '' };
                if (!ws[addr].s) ws[addr].s = {};
                ws[addr].s.border = borderStyle;
            }
        }

        // ── Title cell: centered, bold, no border ──
        const titleCell = XLSX.utils.encode_cell({ r: 0, c: 3 });
        if (!ws[titleCell]) ws[titleCell] = { t: 's', v: workerName };
        if (!ws[titleCell].s) ws[titleCell].s = {};
        ws[titleCell].s.alignment = { horizontal: 'center', vertical: 'center' };
        ws[titleCell].s.font      = { bold: true, sz: 14 };

        // ── Header row: bold + centered + border ──
        for (let C = range.s.c; C <= range.e.c; C++) {
            const addr = XLSX.utils.encode_cell({ r: 1, c: C });
            if (!ws[addr]) ws[addr] = { t: 's', v: '' };
            if (!ws[addr].s) ws[addr].s = {};
            ws[addr].s.font      = { bold: true };
            ws[addr].s.alignment = { horizontal: 'center', vertical: 'center' };
            ws[addr].s.border    = borderStyle;
        }

        // ── Merge worker name across D1:F1 ──
        ws['!merges'] = [{ s: { r: 0, c: 3 }, e: { r: 0, c: 5 } }];

        // ── A4 landscape, fit to 1 page wide ──
        ws['!pageSetup'] = {
            paperSize:   9,
            orientation: 'landscape',
            fitToWidth:  1,
            fitToHeight: 0,
            fitToPage:   true,
        };

        ws['!margins'] = {
            left: 0.5, right: 0.5,
            top:  0.75, bottom: 0.75,
            header: 0.3, footer: 0.3,
        };

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Report');

        const wbout   = XLSX.write(wb, { type: 'base64', bookType: 'xlsx', cellStyles: true });
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;

        await FileSystem.writeAsStringAsync(fileUri, wbout, {
            encoding: FileSystem.EncodingType.Base64,
        });

        return fileUri;
    } catch (err) {
        console.error('Excel generation error:', err);
        return null;
    }
};

const shareExcel = async (uri: string, title: string) => {
    if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: title,
            UTI: 'com.microsoft.excel.xlsx',
        });
    } else {
        Alert.alert('Saved', `File saved to:\n${uri}`);
    }
};

const DateBtn = ({ label, date, onPress }: { label: string; date: Date; onPress: () => void }) => (
    <TouchableOpacity style={styles.datePickerBtn} onPress={onPress} activeOpacity={0.8}>
        <Ionicons name="calendar-outline" size={15} color="#007AFF" />
        <Text style={styles.datePickerLabel}>{label}</Text>
        <Text style={styles.datePickerValue}>{formatDisplayDate(date)}</Text>
    </TouchableOpacity>
);

export default function WorkerShifts() {
    const { userId, name } = useLocalSearchParams();
    const router = useRouter();

    const [shifts, setShifts]         = useState<ShiftItem[]>([]);
    const [loading, setLoading]       = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [reportMode, setReportMode] = useState<'daily' | 'range'>('range');

    const [dailyDate, setDailyDate]           = useState<Date>(new Date());
    const [exportingDaily, setExportingDaily] = useState(false);
    const [dailyProgress, setDailyProgress]   = useState('');

    const today     = new Date();
    const thirtyAgo = new Date(); thirtyAgo.setDate(today.getDate() - 30);
    const [startDate, setStartDate]           = useState<Date>(thirtyAgo);
    const [endDate, setEndDate]               = useState<Date>(today);
    const [exportingRange, setExportingRange] = useState(false);
    const [rangeProgress, setRangeProgress]   = useState('');

    const [pickerVisible, setPickerVisible]   = useState(false);
    const [pickerTarget, setPickerTarget]     = useState<'daily' | 'start' | 'end'>('daily');
    const [tempPickerDate, setTempPickerDate] = useState<Date>(new Date());

    const fetchUserHistory = useCallback(async () => {
        try {
            const data = await authService.getHistory(userId as string);
            console.log('📦 First shift:', JSON.stringify(data?.[0], null, 2));
            setShifts(data);
        } catch (e) {
            console.error('History Fetch Error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userId]);

    useEffect(() => { fetchUserHistory(); }, [fetchUserHistory]);

    const rangeShifts = shifts.filter(s => isBetween(s.date, startDate, endDate));
    const dailyShifts = shifts.filter(s => isSameDay(s.date, dailyDate));

    const openPicker = (target: 'daily' | 'start' | 'end') => {
        setPickerTarget(target);
        setTempPickerDate(
            target === 'daily' ? dailyDate :
            target === 'start' ? startDate : endDate
        );
        setPickerVisible(true);
    };

    const confirmDate = () => {
        if (pickerTarget === 'daily') {
            setDailyDate(tempPickerDate);
        } else if (pickerTarget === 'start') {
            if (tempPickerDate > endDate) {
                Alert.alert('Invalid Range', 'Start date cannot be after end date.');
                return;
            }
            setStartDate(tempPickerDate);
        } else {
            if (tempPickerDate < startDate) {
                Alert.alert('Invalid Range', 'End date cannot be before start date.');
                return;
            }
            setEndDate(tempPickerDate);
        }
        setPickerVisible(false);
    };

    const downloadShiftCSV = async (shiftId: string, date: string) => {
        try {
            const cleanDate   = date.replace(/\//g, '-');
            const fileUri     = `${FileSystem.documentDirectory}Report_${cleanDate}.csv`;
            const downloadUrl = `${API_URL}/download-shift-report/${shiftId}`;
            const dl          = FileSystem.createDownloadResumable(downloadUrl, fileUri);
            const result      = await dl.downloadAsync();
            if (!result || result.status !== 200) {
                Alert.alert('Error', 'Server failed to generate the CSV.');
                return;
            }
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(result.uri, {
                    mimeType: 'text/csv',
                    dialogTitle: `Report for ${date}`,
                    UTI: 'public.comma-separated-values-text',
                });
            } else {
                Alert.alert('Saved', `Saved to: ${result.uri}`);
            }
        } catch (err) {
            console.error('CSV error:', err);
            Alert.alert('Download Failed', 'Something went wrong.');
        }
    };

    const exportDailyExcel = async () => {
        if (dailyShifts.length === 0) {
            Alert.alert('No Shifts', `No shifts found on ${formatDisplayDate(dailyDate)}.`);
            return;
        }
        setExportingDaily(true);
        setDailyProgress('Fetching notes…');
        try {
            const dateStr  = formatDisplayDate(dailyDate).replace(/\//g, '-');
            const safeName = (name as string || 'Worker').replace(/\s+/g, '_');
            const fileName = `${safeName}_Daily_${dateStr}.xlsx`;

            const uri = await buildExcel(
                name as string || 'Worker',
                dailyShifts,
                fileName,
                setDailyProgress
            );

            if (!uri) {
                Alert.alert('No Data', `No visit notes found on ${formatDisplayDate(dailyDate)}.\n\nMake sure the worker added notes during their shift.`);
                return;
            }
            await shareExcel(uri, `Daily Report — ${formatDisplayDate(dailyDate)}`);
        } catch (err) {
            Alert.alert('Export Failed', 'Could not generate Excel file.');
        } finally {
            setExportingDaily(false);
            setDailyProgress('');
        }
    };

    const exportRangeExcel = async () => {
        if (rangeShifts.length === 0) {
            Alert.alert('No Shifts', 'No shifts found in the selected date range.');
            return;
        }
        setExportingRange(true);
        setRangeProgress('Fetching notes…');
        try {
            const from     = formatDisplayDate(startDate).replace(/\//g, '-');
            const to       = formatDisplayDate(endDate).replace(/\//g, '-');
            const safeName = (name as string || 'Worker').replace(/\s+/g, '_');
            const fileName = `${safeName}_Range_${from}_to_${to}.xlsx`;

            const uri = await buildExcel(
                name as string || 'Worker',
                rangeShifts,
                fileName,
                setRangeProgress
            );

            if (!uri) {
                Alert.alert('No Data', 'No visit notes found in this range.\n\nMake sure the worker added notes during shifts.');
                return;
            }
            await shareExcel(uri, `Range Report — ${from} to ${to}`);
        } catch (err) {
            Alert.alert('Export Failed', 'Could not generate Excel file.');
        } finally {
            setExportingRange(false);
            setRangeProgress('');
        }
    };

    const noteCount = (shift: ShiftItem) => getShiftNotes(shift).length;

    const renderShiftCard = ({ item }: { item: ShiftItem }) => {
        const isOngoing = item.logoutTime === 'Ongoing' || !item.logoutTime;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.dateText}>{item.date}</Text>
                    <View style={[styles.statusBadge, isOngoing ? styles.ongoingBg : styles.completedBg]}>
                        <View style={[styles.dot, isOngoing ? styles.ongoingDot : styles.completedDot]} />
                        <Text style={[styles.statusText, isOngoing ? styles.ongoingColor : styles.completedColor]}>
                            {isOngoing ? 'ONGOING' : 'COMPLETED'}
                        </Text>
                    </View>
                </View>

                <View style={styles.timeRow}>
                    <View style={styles.timeBlock}>
                        <Ionicons name="log-in-outline" size={16} color="#8E8E93" />
                        <Text style={styles.timeLabel}> Login: <Text style={styles.timeValue}>{item.loginTime}</Text></Text>
                    </View>
                    <View style={styles.timeBlock}>
                        <Ionicons name="log-out-outline" size={16} color="#8E8E93" />
                        <Text style={styles.timeLabel}> Logout: <Text style={styles.timeValue}>{item.logoutTime}</Text></Text>
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statGroup}>
                        <Ionicons name="location-outline" size={14} color="#8E8E93" />
                        <Text style={styles.statText}>{item.path?.length || 0} Points</Text>
                    </View>
                    <View style={styles.statGroup}>
                        <Ionicons name="document-text-outline" size={14} color="#8E8E93" />
                        <Text style={styles.statText}>{noteCount(item)} Notes</Text>
                    </View>
                    {!isOngoing && (
                        <TouchableOpacity
                            onPress={() => downloadShiftCSV(item._id, item.date)}
                            style={styles.downloadBtn}
                        >
                            <Ionicons name="cloud-download-outline" size={18} color="#007AFF" />
                            <Text style={styles.downloadBtnText}>CSV</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.actionRow}>
                    {isOngoing && (
                        <TouchableOpacity
                            style={[styles.btn, styles.btnLive]}
                            onPress={() => router.push({ pathname: '/(admin)/live-track', params: { userId } })}
                        >
                            <View style={[styles.dot, { backgroundColor: '#34C759' }]} />
                            <Text style={styles.btnLiveText}>Live Track</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.btn, styles.btnDetails, !isOngoing && { width: '100%' }]}
                        onPress={() => router.push({ pathname: '/(admin)/details', params: { shiftId: item._id } })}
                    >
                        <Ionicons name="eye-outline" size={18} color="#007AFF" />
                        <Text style={styles.btnDetailsText}> View Details</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>

            <View style={styles.screenHeader}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>{name || 'User'}'s Shifts</Text>
                </View>
            </View>

            <View style={styles.tabRow}>
                <TouchableOpacity
                    style={[styles.tab, reportMode === 'daily' && styles.tabActive]}
                    onPress={() => setReportMode('daily')}
                >
                    <Ionicons name="today-outline" size={15} color={reportMode === 'daily' ? '#FFF' : '#8E8E93'} />
                    <Text style={[styles.tabText, reportMode === 'daily' && styles.tabTextActive]}>{' '}Daily Report</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, reportMode === 'range' && styles.tabActive]}
                    onPress={() => setReportMode('range')}
                >
                    <Ionicons name="calendar-outline" size={15} color={reportMode === 'range' ? '#FFF' : '#8E8E93'} />
                    <Text style={[styles.tabText, reportMode === 'range' && styles.tabTextActive]}>{' '}Date Range</Text>
                </TouchableOpacity>
            </View>

            {reportMode === 'daily' && (
                <View style={styles.filterCard}>
                    <Text style={styles.filterLabel}>📅 Select Day</Text>
                    <DateBtn label="Date" date={dailyDate} onPress={() => openPicker('daily')} />
                    <View style={[styles.filterBottom, { marginTop: 14 }]}>
                        <View>
                            <Text style={styles.matchCount}>
                                {dailyShifts.length} shift{dailyShifts.length !== 1 ? 's' : ''}
                            </Text>
                            {exportingDaily && dailyProgress !== '' && (
                                <Text style={styles.progressText}>{dailyProgress}</Text>
                            )}
                        </View>
                        <TouchableOpacity
                            style={[styles.exportBtn, styles.exportBtnDaily, exportingDaily && styles.exportBtnDisabled]}
                            onPress={exportDailyExcel}
                            disabled={exportingDaily}
                        >
                            {exportingDaily
                                ? <ActivityIndicator size="small" color="#FFF" />
                                : <>
                                    <Ionicons name="download-outline" size={15} color="#FFF" />
                                    <Text style={styles.exportBtnText}>  Daily Excel</Text>
                                  </>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {reportMode === 'range' && (
                <View style={styles.filterCard}>
                    <Text style={styles.filterLabel}>📅 Date Range</Text>
                    <View style={styles.dateRow}>
                        <DateBtn label="From" date={startDate} onPress={() => openPicker('start')} />
                        <Ionicons name="arrow-forward" size={15} color="#C7C7CC" style={{ marginHorizontal: 6 }} />
                        <DateBtn label="To"   date={endDate}   onPress={() => openPicker('end')} />
                    </View>
                    <View style={styles.filterBottom}>
                        <View>
                            <Text style={styles.matchCount}>
                                {rangeShifts.length} shift{rangeShifts.length !== 1 ? 's' : ''}
                            </Text>
                            {exportingRange && rangeProgress !== '' && (
                                <Text style={styles.progressText}>{rangeProgress}</Text>
                            )}
                        </View>
                        <TouchableOpacity
                            style={[styles.exportBtn, exportingRange && styles.exportBtnDisabled]}
                            onPress={exportRangeExcel}
                            disabled={exportingRange}
                        >
                            {exportingRange
                                ? <ActivityIndicator size="small" color="#FFF" />
                                : <>
                                    <Ionicons name="download-outline" size={15} color="#FFF" />
                                    <Text style={styles.exportBtnText}>  Range Excel</Text>
                                  </>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : (
                <FlatList
                    data={reportMode === 'daily' ? dailyShifts : rangeShifts}
                    keyExtractor={item => item._id}
                    renderItem={renderShiftCard}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={fetchUserHistory} tintColor="#007AFF" />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="calendar-clear-outline" size={48} color="#C7C7CC" />
                            <Text style={styles.emptyText}>
                                {reportMode === 'daily'
                                    ? `No shifts on ${formatDisplayDate(dailyDate)}`
                                    : 'No shifts in selected range'}
                            </Text>
                        </View>
                    }
                />
            )}

            {Platform.OS === 'ios' ? (
                <Modal transparent visible={pickerVisible} animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalSheet}>
                            <View style={styles.modalHeader}>
                                <TouchableOpacity onPress={() => setPickerVisible(false)}>
                                    <Text style={styles.modalCancel}>Cancel</Text>
                                </TouchableOpacity>
                                <Text style={styles.modalTitle}>
                                    {pickerTarget === 'daily' ? 'Select Day'
                                        : pickerTarget === 'start' ? 'Start Date' : 'End Date'}
                                </Text>
                                <TouchableOpacity onPress={confirmDate}>
                                    <Text style={styles.modalDone}>Done</Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePicker
                                value={tempPickerDate}
                                mode="date"
                                display="spinner"
                                onChange={(_, d) => d && setTempPickerDate(d)}
                                maximumDate={new Date()}
                            />
                        </View>
                    </View>
                </Modal>
            ) : (
                pickerVisible && (
                    <DateTimePicker
                        value={tempPickerDate}
                        mode="date"
                        display="default"
                        maximumDate={new Date()}
                        onChange={(_, d) => {
                            setPickerVisible(false);
                            if (!d) return;
                            if (pickerTarget === 'daily') {
                                setDailyDate(d);
                            } else if (pickerTarget === 'start') {
                                if (d > endDate) Alert.alert('Invalid Range', 'Start cannot be after end.');
                                else setStartDate(d);
                            } else {
                                if (d < startDate) Alert.alert('Invalid Range', 'End cannot be before start.');
                                else setEndDate(d);
                            }
                        }}
                    />
                )
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container:    { flex: 1, backgroundColor: '#F2F2F7' },
    center:       { flex: 1, justifyContent: 'center', alignItems: 'center' },

    screenHeader: {
        flexDirection: 'row', alignItems: 'center',
        padding: 20, paddingTop: 50,
        backgroundColor: '#FFF',
        borderBottomWidth: 1, borderBottomColor: '#E5E5EA',
    },
    headerInfo:   { marginLeft: 15 },
    headerTitle:  { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E' },

    tabRow: {
        flexDirection: 'row', margin: 16, marginBottom: 0,
        backgroundColor: '#E5E5EA', borderRadius: 12, padding: 4,
    },
    tab: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', paddingVertical: 10, borderRadius: 10,
    },
    tabActive:     { backgroundColor: '#007AFF' },
    tabText:       { fontSize: 13, fontWeight: '600', color: '#8E8E93' },
    tabTextActive: { color: '#FFF' },

    filterCard: {
        backgroundColor: '#FFF', margin: 16, borderRadius: 16, padding: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    },
    filterLabel:  { fontSize: 13, fontWeight: '700', color: '#1C1C1E', marginBottom: 12 },
    dateRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },

    datePickerBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F2F2F7', borderRadius: 10, padding: 10,
    },
    datePickerLabel: { fontSize: 11, color: '#8E8E93', marginLeft: 6, marginRight: 4 },
    datePickerValue: { fontSize: 13, fontWeight: '700', color: '#1C1C1E', flex: 1 },

    filterBottom:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    matchCount:    { fontSize: 12, color: '#8E8E93' },
    progressText:  { fontSize: 11, color: '#007AFF', marginTop: 2 },

    exportBtn: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#34C759',
        paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
    },
    exportBtnDaily:    { backgroundColor: '#007AFF' },
    exportBtnDisabled: { backgroundColor: '#A8A8A8' },
    exportBtnText:     { color: '#FFF', fontWeight: '700', fontSize: 13 },

    list: { padding: 16 },

    card: {
        backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
    },
    cardHeader:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    dateText:       { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    },
    ongoingBg:      { backgroundColor: '#E8F5E9' },
    completedBg:    { backgroundColor: '#F2F2F7' },
    statusText:     { fontSize: 11, fontWeight: 'bold' },
    ongoingColor:   { color: '#34C759' },
    completedColor: { color: '#8E8E93' },
    dot:            { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    ongoingDot:     { backgroundColor: '#34C759' },
    completedDot:   { backgroundColor: '#8E8E93' },

    timeRow: {
        flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12,
        paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F7',
    },
    timeBlock:  { flexDirection: 'row', alignItems: 'center' },
    timeLabel:  { fontSize: 14, color: '#8E8E93' },
    timeValue:  { color: '#1C1C1E', fontWeight: '600' },

    statsRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    statGroup:  { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
    statText:   { fontSize: 13, color: '#8E8E93', marginLeft: 4 },
    downloadBtn: {
        marginLeft: 'auto', flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F0F7FF', padding: 6, borderRadius: 8,
    },
    downloadBtnText: { color: '#007AFF', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },

    actionRow:      { flexDirection: 'row', justifyContent: 'space-between' },
    btn:            { height: 48, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    btnLive:        { width: '48%', backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#34C759' },
    btnDetails:     { width: '48%', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#007AFF' },
    btnLiveText:    { color: '#34C759', fontWeight: 'bold' },
    btnDetailsText: { color: '#007AFF', fontWeight: 'bold' },

    empty:     { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#8E8E93', fontSize: 16, marginTop: 10 },

    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    modalSheet: {
        backgroundColor: '#FFF', borderTopLeftRadius: 20,
        borderTopRightRadius: 20, paddingBottom: 34,
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5EA',
    },
    modalTitle:  { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
    modalCancel: { fontSize: 16, color: '#FF3B30' },
    modalDone:   { fontSize: 16, color: '#007AFF', fontWeight: '700' },
});