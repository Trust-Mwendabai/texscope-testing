import { useState, useEffect } from 'react';
import PageHeader from '@/components/navigation/page-header';
import CardWrapper from '@/components/card-wrapper';
import { Button } from '@/components/ui/button';
import { Calendar, Download, FileText, BarChart3, PieChart, TrendingUp, Loader2, Eye } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BASE_URL } from '@/constants/ApiConstants';
import { useAuth } from '@/context/AuthContext';

const Reports = () => {
	const { user: authUser } = useAuth();
	const [selectedReport, setSelectedReport] = useState('');
	const [dateRange, setDateRange] = useState('last-30-days');
	const [isGenerating, setIsGenerating] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const [reportData, setReportData] = useState<any>(null);
	const [aiInsights, setAiInsights] = useState<any>(null);
	const [showPreviewModal, setShowPreviewModal] = useState(false);
	const [previewFormat, setPreviewFormat] = useState<'pdf' | 'csv' | 'excel'>('pdf');
	const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
	const userId = authUser?.user_id?.toString() || '1';

	const reportTypes = [
		{ id: 'predictions', name: 'Prediction Performance Report', icon: TrendingUp, description: 'AI model predictions, accuracy metrics, and forecast analysis' },
		{ id: 'recommendations', name: 'AI Recommendations Report', icon: PieChart, description: 'Personalized AI-driven insights and strategic recommendations' },
		{ id: 'model-analysis', name: 'Model Analysis Report', icon: BarChart3, description: 'Comprehensive analysis of trained models and their performance' },
		{ id: 'forecast-insights', name: 'Forecast Insights Report', icon: FileText, description: 'Future trend predictions and business intelligence insights' }
	];

	const dateRanges = [
		{ value: 'last-7-days', label: 'Last 7 Days' },
		{ value: 'last-30-days', label: 'Last 30 Days' },
		{ value: 'last-90-days', label: 'Last 90 Days' },
		{ value: 'last-year', label: 'Last Year' },
		{ value: 'custom', label: 'Custom Range' }
	];

	const handleGenerateReport = async () => {
		if (!selectedReport) return;

		setIsGenerating(true);
		setMessage(null);
		try {
			const response = await fetch(`${BASE_URL}generate_report.php`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					report_type: selectedReport,
					date_range: dateRange,
					user_id: userId
				})
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const text = await response.text();
			console.log('Raw response:', text);

			if (!text) {
				throw new Error('Empty response from server');
			}

			let data;
			try {
				data = JSON.parse(text);
			} catch (e) {
				throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
			}

			console.log('Report response:', data);

			if (data.error) {
				setMessage({ type: 'error', text: `Error: ${data.error}` });
				return;
			}

			setReportData(data);
			
			if (data.data && data.data.length > 0) {
				setMessage({ type: 'success', text: `Report generated successfully! (${data.record_count} records)` });
				try {
					const insightsResponse = await fetch(`${BASE_URL}ai_report_insights.php`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						credentials: 'include',
						body: JSON.stringify({
							report_type: selectedReport,
							report_data: data.data,
							user_id: userId
						})
					});
					const insights = await insightsResponse.json();
					setAiInsights(insights);
				} catch (e) {
					console.warn('Could not fetch AI insights:', e);
				}
			} else {
				setMessage({ type: 'error', text: 'No data available for the selected report and date range. The database tables may be empty.' });
			}
		} catch (error) {
			console.error('Error generating report:', error);
			setMessage({ type: 'error', text: `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}` });
		} finally {
			setIsGenerating(false);
		}
	};

	const handlePreviewModal = (format: 'pdf' | 'csv' | 'excel') => {
		if (!reportData) {
			setMessage({ type: 'error', text: 'Please generate a report first' });
			return;
		}
		setPreviewFormat(format);
		setShowPreviewModal(true);
	};

	const handleExportReport = async (format: 'pdf' | 'csv' | 'excel') => {
		if (!selectedReport || !reportData) {
			setMessage({ type: 'error', text: 'Please generate a report first' });
			return;
		}

		setIsExporting(true);
		setMessage(null);
		try {
			const response = await fetch(`${BASE_URL}export_report.php`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					report_type: selectedReport,
					date_range: dateRange,
					user_id: userId,
					format: format
				})
			});

			if (response.ok) {
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `${selectedReport}_report_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'csv' : format}`;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
				setMessage({ type: 'success', text: `Report exported as ${format.toUpperCase()} successfully!` });
				setShowPreviewModal(false);
			} else {
				setMessage({ type: 'error', text: 'Export failed. Please try again.' });
			}
		} catch (error) {
			console.error('Error exporting report:', error);
			setMessage({ type: 'error', text: 'Network error. Please try again.' });
		} finally {
			setIsExporting(false);
		}
	};

	useEffect(() => {
		if (message) {
			const timer = setTimeout(() => setMessage(null), 3000);
			return () => clearTimeout(timer);
		}
	}, [message]);

	return (
		<>
			<PageHeader
				items={[
					{ label: 'Home', href: '/' },
					{ label: 'Reports', href: '/reports' }
				]}
				heading="Reports & Analytics"
			/>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* Report Selection */}
				<CardWrapper className="lg:col-span-1" title="Generate Report">
					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium mb-2">Report Type</label>
							<Select value={selectedReport} onValueChange={setSelectedReport}>
								<SelectTrigger>
									<SelectValue placeholder="Select a report type" />
								</SelectTrigger>
								<SelectContent>
									{reportTypes.map((report) => (
										<SelectItem key={report.id} value={report.id}>
											{report.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className="block text-sm font-medium mb-2">Date Range</label>
							<Select value={dateRange} onValueChange={setDateRange}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{dateRanges.map((range) => (
										<SelectItem key={range.value} value={range.value}>
											{range.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<Button
							onClick={handleGenerateReport}
							className="w-full"
							disabled={!selectedReport || isGenerating}
						>
							{isGenerating ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Generating...
								</>
							) : (
								<>
									<FileText className="h-4 w-4 mr-2" />
									Generate Report
								</>
							)}
						</Button>
					</div>
				</CardWrapper>

				{/* Report Types Overview */}
				<div className="lg:col-span-2 space-y-4">
					<CardWrapper title="Available Reports">
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							{reportTypes.map((report) => (
								<div
									key={report.id}
									className="p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
									onClick={() => setSelectedReport(report.id)}
								>
									<div className="flex items-center gap-3 mb-2">
										<report.icon className="h-6 w-6 text-primary" />
										<h3 className="font-semibold">{report.name}</h3>
									</div>
									<p className="text-sm text-muted-foreground">{report.description}</p>
								</div>
							))}
						</div>
					</CardWrapper>

					{/* Messages */}
					{message && (
						<Alert className={message.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
							<AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
								{message.text}
							</AlertDescription>
						</Alert>
					)}

					{/* Quick Actions */}
					{reportData && (
						<CardWrapper title="Quick Actions">
							<div className="flex flex-wrap gap-2">
								<Button 
									variant="outline" 
									size="sm" 
									onClick={() => handlePreviewModal('pdf')}
									disabled={isExporting}
								>
									<Eye className="h-4 w-4 mr-2" />
									Preview & Export PDF
								</Button>
								<Button 
									variant="outline" 
									size="sm" 
									onClick={() => handleExportReport('csv')}
									disabled={isExporting}
								>
									<Download className="h-4 w-4 mr-2" />
									Export CSV
								</Button>
								<Button 
									variant="outline" 
									size="sm" 
									onClick={() => handleExportReport('excel')}
									disabled={isExporting}
								>
									<Download className="h-4 w-4 mr-2" />
									Export Excel
								</Button>
							</div>
						</CardWrapper>
					)}

					{/* Report Preview */}
					{reportData && (
						<CardWrapper title="Report Preview">
							<div className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div className="bg-blue-50 p-4 rounded-lg">
										<h4 className="font-semibold text-blue-900">Total Records</h4>
										<p className="text-2xl font-bold text-blue-600">
											{reportData.data ? reportData.data.length : 0}
										</p>
									</div>
									<div className="bg-green-50 p-4 rounded-lg">
										<h4 className="font-semibold text-green-900">Date Range</h4>
										<p className="text-sm text-green-700">
											{reportData.start_date} to {reportData.end_date}
										</p>
									</div>
									<div className="bg-purple-50 p-4 rounded-lg">
										<h4 className="font-semibold text-purple-900">Generated</h4>
										<p className="text-sm text-purple-700">
											{new Date(reportData.generated_at).toLocaleString()}
										</p>
									</div>
								</div>

								<div className="border rounded-lg overflow-hidden">
									<div className="bg-gray-50 px-4 py-2 border-b">
										<h4 className="font-medium">Data Preview (First 10 rows)</h4>
									</div>
									<div className="overflow-x-auto max-h-64">
										<table className="w-full text-sm">
											<thead className="bg-gray-50">
												<tr>
													{reportData.data && reportData.data.length > 0 && Object.keys(reportData.data[0]).map((key: string) => (
														<th key={key} className="text-left p-3 font-medium border-b">
															{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
														</th>
													))}
												</tr>
											</thead>
											<tbody>
												{reportData.data && reportData.data.slice(0, 10).map((row: any, index: number) => (
													<tr key={index} className="border-b hover:bg-gray-50">
														{Object.values(row).map((value: any, i: number) => (
															<td key={i} className="p-3">{String(value)}</td>
														))}
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							</div>
						</CardWrapper>
					)}

					{/* AI Insights */}
					{aiInsights && (
						<CardWrapper title="AI Insights">
							<div className="space-y-4">
								{aiInsights.summary && (
									<div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
										<h4 className="font-semibold text-blue-900 mb-2">Executive Summary</h4>
										<p className="text-blue-800 text-sm">{aiInsights.summary}</p>
									</div>
								)}
								{aiInsights.key_findings && (
									<div>
										<h4 className="font-semibold mb-3">Key Findings</h4>
										<div className="space-y-2">
											{aiInsights.key_findings.map((finding: any, index: number) => (
												<div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
													<span className="text-xs font-medium text-indigo-600 bg-indigo-100 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
														{index + 1}
													</span>
													<p className="text-gray-800 text-sm">{finding}</p>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						</CardWrapper>
					)}

					{/* Preview Modal */}
					<Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
						<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
							<DialogHeader>
								<DialogTitle>Report Preview - {previewFormat.toUpperCase()}</DialogTitle>
							</DialogHeader>
							<div className="space-y-4">
								<div className="bg-gray-50 p-6 rounded-lg border">
									{previewFormat === 'pdf' ? (
										<div className="space-y-4">
											<h3 className="text-lg font-semibold">{selectedReport.replace(/-/g, ' ').toUpperCase()}</h3>
											<div className="grid grid-cols-3 gap-4">
												<div className="bg-white p-4 rounded border">
													<p className="text-sm text-gray-600">Total Records</p>
													<p className="text-2xl font-bold">{reportData?.data?.length || 0}</p>
												</div>
												<div className="bg-white p-4 rounded border">
													<p className="text-sm text-gray-600">Date Range</p>
													<p className="text-sm font-semibold">{reportData?.start_date} to {reportData?.end_date}</p>
												</div>
												<div className="bg-white p-4 rounded border">
													<p className="text-sm text-gray-600">Generated</p>
													<p className="text-sm font-semibold">{new Date(reportData?.generated_at).toLocaleDateString()}</p>
												</div>
											</div>
											{aiInsights?.summary && (
												<div className="bg-blue-50 p-4 rounded border-l-4 border-blue-500">
													<p className="font-semibold text-blue-900 mb-2">Executive Summary</p>
													<p className="text-blue-800 text-sm">{aiInsights.summary}</p>
												</div>
											)}
										</div>
									) : (
										<div className="space-y-2">
											<p className="text-sm text-gray-600">
												<strong>Format:</strong> {previewFormat.toUpperCase()}
											</p>
											<p className="text-sm text-gray-600">
												<strong>Records:</strong> {reportData?.data?.length || 0}
											</p>
											<p className="text-sm text-gray-600">
												<strong>Date Range:</strong> {reportData?.start_date} to {reportData?.end_date}
											</p>
											<p className="text-sm text-gray-600 mt-4">
												This will download your report as a {previewFormat.toUpperCase()} file with all data and insights.
											</p>
										</div>
									)}
								</div>

								<div className="flex justify-end gap-3">
									<Button 
										variant="outline" 
										onClick={() => setShowPreviewModal(false)}
									>
										Cancel
									</Button>
									<Button 
										onClick={() => handleExportReport(previewFormat)}
										disabled={isExporting}
									>
										{isExporting ? (
											<>
												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
												Exporting...
											</>
										) : (
											<>
												<Download className="h-4 w-4 mr-2" />
												Download {previewFormat.toUpperCase()}
											</>
										)}
									</Button>
								</div>
							</div>
						</DialogContent>
					</Dialog>
				</div>
			</div>
		</>
	);
};

export default Reports;
