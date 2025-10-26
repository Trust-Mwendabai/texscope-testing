import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, UserMinus, Key, Shield, Loader2, AlertCircle, CheckCircle, Trash2, Edit, Upload, User } from 'lucide-react';
import RequiredAsterisk from '../required-asterisk';
import { BASE_URL } from '@/constants/ApiConstants';
import { useAuth } from '@/context/AuthContext';

interface User {
	name: string;
	title: string;
	avatar: string;
	education: string;
	location: string;
	skills: string;
	notes: string;
	department?: string;
	employeeId?: string;
	joinDate?: string;
	profile_picture?: string;
}

const settingsSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	email: z.string().min(1, 'Email is required').email('Invalid email'),
	department: z.string().min(1, 'Department is required'),
	employeeId: z.string().min(1, 'Employee ID is required'),
	skills: z.string().min(1, 'Skills are required')
});

const passwordSchema = z.object({
	currentPassword: z.string().min(1, 'Current password is required'),
	newPassword: z.string().min(6, 'Password must be at least 6 characters'),
	confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine((data) => data.newPassword === data.confirmPassword, {
	message: "Passwords don't match",
	path: ["confirmPassword"],
});

const adminSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	email: z.string().min(1, 'Email is required').email('Invalid email'),
	password: z.string().min(6, 'Password must be at least 6 characters')
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const ProfileSettings = ({ user }: { user: User }) => {
	const { user: authUser, updateUser } = useAuth();
	const navigate = useNavigate();
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [users, setUsers] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
	const [initialized, setInitialized] = useState(false);
	const [serverUser, setServerUser] = useState<any | null>(null);

	const settingsForm = useForm<SettingsFormValues>({
		resolver: zodResolver(settingsSchema),
		defaultValues: {
			name: user.name,
			email: authUser?.email || '',
			department: user.department || '',
			employeeId: user.employeeId || '',
			skills: user.skills
		}
	});

	const passwordForm = useForm({
		resolver: zodResolver(passwordSchema),
		defaultValues: {
			currentPassword: '',
			newPassword: '',
			confirmPassword: ''
		}
	});

	const userForm = useForm({
		resolver: zodResolver(adminSchema),
		defaultValues: {
			name: '',
			email: '',
			password: ''
		}
	});

	useEffect(() => {
		if (authUser?.account_type === 'super_admin') {
			loadUsers();
		}
	}, [authUser]);

	useEffect(() => {
		// Fetch the current user's profile from backend and populate the form
		const fetchProfile = async () => {
			if (!authUser?.user_id || initialized) return;
			try {
				const res = await fetch(`${BASE_URL}user_data.php`, {
					method: 'GET',
					credentials: 'include',
					headers: { 'Content-Type': 'application/json' }
				});
				const data = await res.json();
				if (data && (data.status === 'success' || data.user)) {
					const u = data.user || data.data || data; // support different shapes
					setServerUser(u);
					settingsForm.reset({
						name: u.username || u.name || user.name,
						email: u.email || authUser.email || '',
						department: u.department || user.department || '',
						employeeId: u.employee_id || u.employeeId || user.employeeId || '',
						skills: u.skills || user.skills || ''
					});
					// show current profile picture if any
					if (u.profile_picture && !previewUrl) {
						// keep as server path; preview only when selecting a file
					}
				}
			} catch (e) {
				console.error('Failed to fetch profile:', e);
			} finally {
				setInitialized(true);
			}
		};
		fetchProfile();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [authUser?.user_id]);

	const loadUsers = async () => {
		try {
			const response = await fetch(`${BASE_URL}user_management.php?action=get_users`, {
				method: 'GET',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				}
			});

			const data = await response.json();
			if (data.status === 'success') {
				setUsers(data.data);
			}
		} catch (error) {
			console.error('Error loading users:', error);
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
	const file = e.target.files?.[0];
	if (file) {
		const reader = new FileReader();
		reader.onloadend = () => {
			setPreviewUrl(reader.result as string);
		};
		reader.readAsDataURL(file);
	}
};

const handleProfilePictureUpload = async (e: React.FormEvent) => {
	e.preventDefault();
	const fileInput = document.getElementById('profile-picture') as HTMLInputElement;
	const file = fileInput.files?.[0];
	
	if (!file) {
		setMessage({ type: 'error', text: 'Please select a file to upload' });
		return;
	}

	const formData = new FormData();
	formData.append('profile_picture', file);

	setIsUploading(true);
	try {
		const response = await fetch(`${BASE_URL}save_profile_picture.php`, {
			method: 'POST',
			credentials: 'include',
			body: formData,
		});

		const result = await response.json();
		if (result.status === 'success') {
			setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
			// Update the user context with the new profile picture
			if (updateUser && result.profile_picture) {
				updateUser({ ...authUser, profile_picture: result.profile_picture });
			}
			// Reset the file input
			fileInput.value = '';
			setPreviewUrl(null);
		} else {
			setMessage({ type: 'error', text: result.message || 'Failed to upload profile picture' });
		}
	} catch (error) {
		console.error('Error uploading profile picture:', error);
		setMessage({ type: 'error', text: 'Network error. Please try again.' });
	} finally {
		setIsUploading(false);
	}
};

const onSettingsSubmit = async (data: SettingsFormValues) => {
		setLoading(true);
		setMessage(null);

		try {
			// 1) Update basic fields (username/email)
			const basicRes = await fetch(`${BASE_URL}user_management.php`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					user_id: authUser?.user_id,
					username: data.name,
					email: data.email
				})
			});
			const basicResult = await basicRes.json();
			if (basicResult.status !== 'success') {
				throw new Error(basicResult.message || 'Failed to update basic profile');
			}

			// 2) Update extended fields (department, employeeId, skills) if endpoint available
			try {
				await fetch(`${BASE_URL}update_personal_details.php`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({
						user_id: authUser?.user_id,
						department: data.department,
						employee_id: data.employeeId,
						skills: data.skills
					})
				});
			} catch (e) {
				// Don't fail the entire operation if this part isn't supported; log instead.
				console.warn('Extended profile update failed or endpoint missing:', e);
			}

			// Update auth context so UI reflects changes immediately
			if (updateUser) {
				updateUser({
					...authUser,
					username: data.name,
					email: data.email,
					department: data.department,
					employee_id: data.employeeId,
					skills: data.skills,
				});
			}

			setMessage({ type: 'success', text: 'Profile updated successfully!' });
		} catch (error: any) {
			console.error('Error updating profile:', error);
			setMessage({ type: 'error', text: error.message || 'Network error. Please try again.' });
		} finally {
			setLoading(false);
		}
	};

	const onPasswordSubmit = async (data: any) => {
		setLoading(true);
		setMessage(null);

		try {
			const response = await fetch(`${BASE_URL}user_management.php`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					user_id: authUser?.user_id,
					current_password: data.currentPassword,
					new_password: data.newPassword
				})
			});

			const result = await response.json();
			if (result.status === 'success') {
			setMessage({ type: 'success', text: 'Password changed successfully!' });
			passwordForm.reset();
			} else {
			setMessage({ type: 'error', text: result.message || 'Failed to change password' });
			}
		} catch (error) {
			console.error('Error changing password:', error);
			setMessage({ type: 'error', text: 'Network error. Please try again.' });
		} finally {
			setLoading(false);
		}
	};

	const onCreateUser = async (data: any) => {
		setLoading(true);
		setMessage(null);

		try {
			const response = await fetch(`${BASE_URL}add_user.php`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					username: data.name,
					email: data.email,
					password: data.password,
					account_type: 'user'
				})
			});

			const result = await response.json();
			if (result.status === 'success') {
				setMessage({ type: 'success', text: 'User created successfully!' });
				userForm.reset();
				loadUsers();
			} else {
				setMessage({ type: 'error', text: result.message || 'Failed to create user' });
			}
		} catch (error) {
			console.error('Error creating user:', error);
			setMessage({ type: 'error', text: 'Network error. Please try again.' });
		} finally {
			setLoading(false);
		}
	};

	const updateUserRole = async (userId: string, newRole: string) => {
		try {
			const response = await fetch(`${BASE_URL}user_management.php`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					user_id: userId,
					account_type: newRole
				})
			});

			const result = await response.json();
			if (result.status === 'success') {
				setMessage({ type: 'success', text: 'User role updated successfully!' });
				loadUsers();
			} else {
				setMessage({ type: 'error', text: result.message || 'Failed to update user role' });
			}
		} catch (error) {
			console.error('Error updating user role:', error);
			setMessage({ type: 'error', text: 'Network error. Please try again.' });
		}
	};

	const deleteUser = async (userId: string) => {
		if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
			return;
		}

		try {
			const response = await fetch(`${BASE_URL}user_management.php?user_id=${userId}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include'
			});

			const result = await response.json();
			if (result.status === 'success') {
				setMessage({ type: 'success', text: 'User deleted successfully!' });
				loadUsers();
			} else {
				setMessage({ type: 'error', text: result.message || 'Failed to delete user' });
			}
		} catch (error) {
			console.error('Error deleting user:', error);
			setMessage({ type: 'error', text: 'Network error. Please try again.' });
		}
	};

	return (
		<div className="space-y-6">
			{message && (
				<Alert className={message.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
					{message.type === 'success' ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
					<AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
						{message.text}
					</AlertDescription>
				</Alert>
			)}

			<Tabs defaultValue="profile" className="w-full">
				<TabsList className={`grid w-full ${authUser?.account_type === 'super_admin' ? 'grid-cols-3' : 'grid-cols-3'}`}>
				<TabsTrigger value="profile">Profile Settings</TabsTrigger>
				<TabsTrigger value="password">Change Password</TabsTrigger>
				{authUser?.account_type === 'super_admin' && (
				<TabsTrigger value="admin">User Management</TabsTrigger>
				)}
				</TabsList>
				<div className="flex justify-end mb-2">
				<Button variant="outline" onClick={() => navigate('/faq')}>Help & FAQ</Button>
				</div>

				<TabsContent value="profile">
					<Card className="mb-6">
						<CardHeader>
							<CardTitle>Profile Picture</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-6">
								<div className="relative">
									{previewUrl || user.profile_picture ? (
										<img 
											src={previewUrl || `${BASE_URL}${user.profile_picture}`} 
											alt="Profile" 
											className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
										/>
									) : (
									<div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
										<User className="w-12 h-12 text-gray-400" />
									</div>
									)}
								</div>
								<div className="flex-1">
									<form onSubmit={handleProfilePictureUpload} className="space-y-4">
										<div>
											<label 
												className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer"
											>
												<Upload className="h-4 w-4 mr-2" />
												{previewUrl ? 'Change Picture' : 'Upload Picture'}
												<input
													id="profile-picture"
													name="profile_picture"
													type="file"
													className="sr-only"
													accept="image/*"
													onChange={handleFileChange}
												/>
											</label>
											<p className="mt-1 text-xs text-gray-500">JPG, GIF or PNG. Max size 2MB</p>
										</div>
										{previewUrl && (
											<Button 
												type="submit" 
												disabled={isUploading}
												className="bg-primary text-white hover:bg-primary/90"
											>
												{isUploading ? (
													<>
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														Uploading...
													</>
												) : 'Save Picture'}
											</Button>
										)}
									</form>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="mb-6">
						<CardHeader>
							<CardTitle>Profile Information</CardTitle>
						</CardHeader>
						<CardContent>
							<Form {...settingsForm}>
								<form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-4">
									<FormField
										control={settingsForm.control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Name <RequiredAsterisk /></FormLabel>
												<FormControl>
													<Input placeholder="Full Name" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={settingsForm.control}
										name="email"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Email <RequiredAsterisk /></FormLabel>
												<FormControl>
													<Input placeholder="Email" type="email" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={settingsForm.control}
										name="department"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Department <RequiredAsterisk /></FormLabel>
												<FormControl>
													<Input placeholder="Your department" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={settingsForm.control}
										name="employeeId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Employee ID <RequiredAsterisk /></FormLabel>
												<FormControl>
													<Input placeholder="Your employee ID" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={settingsForm.control}
										name="skills"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Skills <RequiredAsterisk /></FormLabel>
												<FormControl>
													<Input placeholder="Technical skills" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<Button type="submit" className="w-full">
										Update Profile
									</Button>
								</form>
							</Form>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="password">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center">
								<Key className="h-5 w-5 mr-2" />
								Change Password
							</CardTitle>
						</CardHeader>
						<CardContent>
							<Form {...passwordForm}>
								<form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
									<FormField
										control={passwordForm.control}
										name="currentPassword"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Current Password <RequiredAsterisk /></FormLabel>
												<FormControl>
													<Input type="password" placeholder="Enter current password" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={passwordForm.control}
										name="newPassword"
										render={({ field }) => (
											<FormItem>
												<FormLabel>New Password <RequiredAsterisk /></FormLabel>
												<FormControl>
													<Input type="password" placeholder="Enter new password" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={passwordForm.control}
										name="confirmPassword"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Confirm New Password <RequiredAsterisk /></FormLabel>
												<FormControl>
													<Input type="password" placeholder="Confirm new password" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<Button type="submit" className="w-full" disabled={loading}>
										{loading ? (
											<>
												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
												Changing Password...
											</>
										) : (
											<>
												<Key className="h-4 w-4 mr-2" />
												Change Password
											</>
										)}
									</Button>
								</form>
							</Form>
						</CardContent>
					</Card>
				</TabsContent>

				{authUser?.account_type === 'super_admin' && (
					<TabsContent value="admin">
						<div className="space-y-6">
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center">
										<Shield className="h-5 w-5 mr-2" />
										User Management
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										<div className="flex justify-between items-center">
											<h3 className="text-lg font-medium">All Users</h3>
											<Dialog>
												<DialogTrigger asChild>
													<Button>
														<UserPlus className="h-4 w-4 mr-2" />
														Add New User
													</Button>
												</DialogTrigger>
												<DialogContent>
													<DialogHeader>
														<DialogTitle>Create New User</DialogTitle>
													</DialogHeader>
													<Form {...userForm}>
														<form onSubmit={userForm.handleSubmit(onCreateUser)} className="space-y-4">
															<FormField
																control={userForm.control}
																name="name"
																render={({ field }) => (
																	<FormItem>
																		<FormLabel>Name <RequiredAsterisk /></FormLabel>
																		<FormControl>
																			<Input placeholder="Full Name" {...field} />
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<FormField
																control={userForm.control}
																name="email"
																render={({ field }) => (
																	<FormItem>
																		<FormLabel>Email <RequiredAsterisk /></FormLabel>
																		<FormControl>
																			<Input type="email" placeholder="Email" {...field} />
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<FormField
																control={userForm.control}
																name="password"
																render={({ field }) => (
																	<FormItem>
																		<FormLabel>Password <RequiredAsterisk /></FormLabel>
																		<FormControl>
																			<Input type="password" placeholder="Password" {...field} />
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<Button type="submit" className="w-full" disabled={loading}>
																{loading ? (
																	<>
																		<Loader2 className="h-4 w-4 mr-2 animate-spin" />
																		Creating User...
																	</>
																) : (
																	'Create User'
																)}
															</Button>
														</form>
													</Form>
												</DialogContent>
											</Dialog>
										</div>

										<div className="border rounded-lg">
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>Name</TableHead>
														<TableHead>Email</TableHead>
														<TableHead>Role</TableHead>
														<TableHead>Created</TableHead>
														<TableHead>Actions</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{users.map((userData: any) => (
														<TableRow key={userData.user_id}>
															<TableCell className="font-medium">{userData.username}</TableCell>
															<TableCell>{userData.email}</TableCell>
															<TableCell>
																<Select
																	value={userData.account_type}
																	onValueChange={(value) => updateUserRole(userData.user_id, value)}
																	disabled={userData.user_id === authUser.user_id}
																>
																	<SelectTrigger className="w-32">
																		<SelectValue />
																	</SelectTrigger>
																	<SelectContent>
																		<SelectItem value="user">User</SelectItem>
																		<SelectItem value="admin">Admin</SelectItem>
																		<SelectItem value="super_admin">Super Admin</SelectItem>
																	</SelectContent>
																</Select>
															</TableCell>
															<TableCell>{new Date(userData.date_created).toLocaleDateString()}</TableCell>
															<TableCell>
																{userData.user_id !== authUser.user_id && (
																	<Button
																		variant="outline"
																		size="sm"
																		onClick={() => deleteUser(userData.user_id)}
																		className="text-red-600 hover:text-red-700"
																	>
																		<Trash2 className="h-4 w-4 mr-1" />
																		Delete
																	</Button>
																)}
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					</TabsContent>
				)}
			</Tabs>
		</div>
	);
};

export default ProfileSettings;
