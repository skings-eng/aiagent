import mongoose, { Document, Schema, Model } from 'mongoose';

// Settings static methods interface
interface ISettingsModel extends Model<ISettings> {
  getByCategory(category: string, includePrivate?: boolean): Promise<ISettings[]>;
  getByKey(category: string, key: string): Promise<ISettings | null>;
  getPublic(): Promise<ISettings[]>;
  bulkUpdate(
    updates: Array<{ category: string; key: string; value: any }>,
    updatedBy: mongoose.Types.ObjectId,
    reason?: string
  ): Promise<void>;
  initializeDefaults(createdBy: mongoose.Types.ObjectId): Promise<void>;
}

// Settings interface
export interface ISettings extends Document {
  _id: mongoose.Types.ObjectId;
  category: 'general' | 'api' | 'ai' | 'security' | 'notifications' | 'backup' | 'system';
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  isPublic: boolean; // Whether this setting can be read by non-admin users
  isEditable: boolean; // Whether this setting can be modified
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
    customValidator?: string; // Name of custom validation function
  };
  metadata: {
    group?: string;
    order?: number;
    tags?: string[];
    dependencies?: string[]; // Other settings this depends on
    affects?: string[]; // Other settings this affects
    restartRequired?: boolean; // Whether changing this requires system restart
    sensitive?: boolean; // Whether this contains sensitive information
  };
  history: Array<{
    value: any;
    changedBy: mongoose.Types.ObjectId;
    changedAt: Date;
    reason?: string;
    version?: string;
  }>;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  updateValue(newValue: any, changedBy: mongoose.Types.ObjectId, reason?: string): Promise<void>;
  validateValue(value: any): { isValid: boolean; errors: string[] };
  getDisplayValue(): any;
  toJSON(): any;
}

// Settings schema
const settingsSchema = new Schema<ISettings>({
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['general', 'api', 'ai', 'security', 'notifications', 'backup', 'system'],
    index: true,
  },
  key: {
    type: String,
    required: [true, 'Key is required'],
    trim: true,
    maxlength: [100, 'Key must not exceed 100 characters'],
    match: [/^[a-zA-Z0-9_.-]+$/, 'Key can only contain letters, numbers, underscores, dots, and hyphens'],
  },
  value: {
    type: Schema.Types.Mixed,
    required: [true, 'Value is required'],
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: ['string', 'number', 'boolean', 'object', 'array'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description must not exceed 500 characters'],
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  isEditable: {
    type: Boolean,
    default: true,
  },
  validation: {
    required: { type: Boolean, default: false },
    minLength: { type: Number, min: 0 },
    maxLength: { type: Number, min: 0 },
    min: { type: Number },
    max: { type: Number },
    pattern: { type: String },
    enum: [Schema.Types.Mixed],
    customValidator: { type: String },
  },
  metadata: {
    group: {
      type: String,
      trim: true,
      maxlength: [50, 'Group must not exceed 50 characters'],
    },
    order: {
      type: Number,
      default: 0,
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: [30, 'Tag must not exceed 30 characters'],
    }],
    dependencies: [{
      type: String,
      trim: true,
    }],
    affects: [{
      type: String,
      trim: true,
    }],
    restartRequired: {
      type: Boolean,
      default: false,
    },
    sensitive: {
      type: Boolean,
      default: false,
    },
  },
  history: [{
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [200, 'Reason must not exceed 200 characters'],
    },
    version: {
      type: String,
      trim: true,
    },
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required'],
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Updated by user is required'],
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
settingsSchema.index({ category: 1, key: 1 }, { unique: true });
settingsSchema.index({ category: 1, 'metadata.group': 1, 'metadata.order': 1 });
settingsSchema.index({ isPublic: 1 });
settingsSchema.index({ 'metadata.tags': 1 });
settingsSchema.index({ updatedAt: -1 });

// Virtual for full key (category.key)
settingsSchema.virtual('fullKey').get(function() {
  return `${this.category}.${this.key}`;
});

// Pre-save middleware to limit history size
settingsSchema.pre('save', function(next) {
  // Keep only the last 50 history entries
  if (this.history && this.history.length > 50) {
    this.history = this.history.slice(-50);
  }
  
  next();
});

// Instance method to update value
settingsSchema.methods.updateValue = async function(
  newValue: any,
  changedBy: mongoose.Types.ObjectId,
  reason?: string
): Promise<void> {
  // Validate the new value
  const validation = this.validateValue(newValue);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }
  
  // Add current value to history
  this.history.push({
    value: this.value,
    changedBy,
    changedAt: new Date(),
    reason,
  });
  
  // Update the value
  this.value = newValue;
  this.updatedBy = changedBy;
  
  return this.save();
};

// Instance method to validate value
settingsSchema.methods.validateValue = function(value: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const validation = this.validation;
  
  if (!validation) {
    return { isValid: true, errors: [] };
  }
  
  // Check if required
  if (validation.required && (value === undefined || value === null || value === '')) {
    errors.push('Value is required');
    return { isValid: false, errors };
  }
  
  // Skip further validation if value is not provided and not required
  if (value === undefined || value === null) {
    return { isValid: true, errors: [] };
  }
  
  // Type validation
  const actualType = Array.isArray(value) ? 'array' : typeof value;
  if (actualType !== this.type) {
    errors.push(`Value must be of type ${this.type}, got ${actualType}`);
    return { isValid: false, errors };
  }
  
  // String validation
  if (this.type === 'string' && typeof value === 'string') {
    if (validation.minLength && value.length < validation.minLength) {
      errors.push(`Value must be at least ${validation.minLength} characters long`);
    }
    if (validation.maxLength && value.length > validation.maxLength) {
      errors.push(`Value must not exceed ${validation.maxLength} characters`);
    }
    if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
      errors.push('Value does not match the required pattern');
    }
  }
  
  // Number validation
  if (this.type === 'number' && typeof value === 'number') {
    if (validation.min !== undefined && value < validation.min) {
      errors.push(`Value must be at least ${validation.min}`);
    }
    if (validation.max !== undefined && value > validation.max) {
      errors.push(`Value must not exceed ${validation.max}`);
    }
  }
  
  // Enum validation
  if (validation.enum && Array.isArray(validation.enum) && validation.enum.length > 0 && !validation.enum.includes(value)) {
    errors.push(`Value must be one of: ${validation.enum.join(', ')}`);
  }
  
  // Custom validation would go here
  if (validation.customValidator) {
    // This would call a custom validation function
    // For now, we'll skip this
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Instance method to get display value
settingsSchema.methods.getDisplayValue = function(): any {
  // Hide sensitive values
  if (this.metadata.sensitive) {
    if (this.type === 'string') {
      return '***HIDDEN***';
    }
    return '[SENSITIVE]';
  }
  
  return this.value;
};

// Override toJSON to handle sensitive data
settingsSchema.methods.toJSON = function() {
  const settingsObject = this.toObject();
  
  // Hide sensitive values in JSON output
  if (this.metadata.sensitive) {
    settingsObject.value = this.getDisplayValue();
  }
  
  // Remove sensitive history values
  if (settingsObject.history) {
    settingsObject.history = settingsObject.history.map((entry: any) => ({
      ...entry,
      value: this.metadata.sensitive ? '[SENSITIVE]' : entry.value,
    }));
  }
  
  delete settingsObject.__v;
  
  return settingsObject;
};

// Static method to get settings by category
settingsSchema.statics.getByCategory = function(category: string, includePrivate = false) {
  const query: any = { category };
  
  if (!includePrivate) {
    query.isPublic = true;
  }
  
  return this.find(query).sort({ 'metadata.group': 1, 'metadata.order': 1 });
};

// Static method to get setting by full key
settingsSchema.statics.getByKey = function(category: string, key: string) {
  return this.findOne({ category, key });
};

// Static method to get all public settings
settingsSchema.statics.getPublic = function() {
  return this.find({ isPublic: true }).sort({ category: 1, 'metadata.group': 1, 'metadata.order': 1 });
};

// Static method to bulk update settings
settingsSchema.statics.bulkUpdate = async function(
  updates: Array<{ category: string; key: string; value: any }>,
  updatedBy: mongoose.Types.ObjectId,
  reason?: string
) {
  const results = [];
  
  for (const update of updates) {
    try {
      const setting = await this.findOne({ category: update.category, key: update.key });
      
      if (!setting) {
        results.push({
          category: update.category,
          key: update.key,
          success: false,
          error: 'Setting not found',
        });
        continue;
      }
      
      if (!setting.isEditable) {
        results.push({
          category: update.category,
          key: update.key,
          success: false,
          error: 'Setting is not editable',
        });
        continue;
      }
      
      await setting.updateValue(update.value, updatedBy, reason);
      
      results.push({
        category: update.category,
        key: update.key,
        success: true,
        oldValue: setting.history[setting.history.length - 1]?.value,
        newValue: update.value,
      });
    } catch (error) {
      results.push({
        category: update.category,
        key: update.key,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  return results;
};

// Static method to initialize default settings
settingsSchema.statics.initializeDefaults = async function(createdBy: mongoose.Types.ObjectId) {
  const defaultSettings = [
    // General settings
    {
      category: 'general',
      key: 'app_name',
      value: 'AI Agent Platform',
      type: 'string',
      description: 'Application name displayed in the interface',
      isPublic: true,
      metadata: { group: 'branding', order: 1 },
    },
    {
      category: 'general',
      key: 'app_version',
      value: '1.0.0',
      type: 'string',
      description: 'Current application version',
      isPublic: true,
      isEditable: false,
      metadata: { group: 'branding', order: 2 },
    },
    {
      category: 'general',
      key: 'default_language',
      value: 'en',
      type: 'string',
      description: 'Default language for new users',
      isPublic: true,
      validation: { enum: ['en', 'ja', 'zh', 'es', 'fr', 'de'] },
      metadata: { group: 'localization', order: 1 },
    },
    {
      category: 'general',
      key: 'timezone',
      value: 'UTC',
      type: 'string',
      description: 'Default timezone for the application',
      isPublic: true,
      metadata: { group: 'localization', order: 2 },
    },
    
    // API settings
    {
      category: 'api',
      key: 'rate_limit_requests_per_minute',
      value: 100,
      type: 'number',
      description: 'Maximum API requests per minute per user',
      isPublic: false,
      validation: { min: 1, max: 10000 },
      metadata: { group: 'rate_limiting', order: 1, restartRequired: true },
    },
    {
      category: 'api',
      key: 'max_request_size',
      value: 10485760, // 10MB
      type: 'number',
      description: 'Maximum request size in bytes',
      isPublic: false,
      validation: { min: 1024, max: 104857600 }, // 1KB to 100MB
      metadata: { group: 'limits', order: 1, restartRequired: true },
    },
    {
      category: 'api',
      key: 'enable_cors',
      value: true,
      type: 'boolean',
      description: 'Enable Cross-Origin Resource Sharing',
      isPublic: false,
      metadata: { group: 'security', order: 1, restartRequired: true },
    },
    
    // AI settings
    {
      category: 'ai',
      key: 'default_model',
      value: 'gpt-3.5-turbo',
      type: 'string',
      description: 'Default AI model for new conversations',
      isPublic: true,
      metadata: { group: 'models', order: 1 },
    },
    {
      category: 'ai',
      key: 'max_tokens_per_request',
      value: 4000,
      type: 'number',
      description: 'Maximum tokens per AI request',
      isPublic: false,
      validation: { min: 100, max: 200000 },
      metadata: { group: 'limits', order: 1 },
    },
    {
      category: 'ai',
      key: 'enable_streaming',
      value: true,
      type: 'boolean',
      description: 'Enable streaming responses from AI models',
      isPublic: true,
      metadata: { group: 'features', order: 1 },
    },
    
    // Security settings
    {
      category: 'security',
      key: 'session_timeout',
      value: 3600, // 1 hour
      type: 'number',
      description: 'Session timeout in seconds',
      isPublic: false,
      validation: { min: 300, max: 86400 }, // 5 minutes to 24 hours
      metadata: { group: 'authentication', order: 1 },
    },
    {
      category: 'security',
      key: 'password_min_length',
      value: 8,
      type: 'number',
      description: 'Minimum password length',
      isPublic: true,
      validation: { min: 6, max: 128 },
      metadata: { group: 'password_policy', order: 1 },
    },
    {
      category: 'security',
      key: 'enable_two_factor',
      value: false,
      type: 'boolean',
      description: 'Enable two-factor authentication',
      isPublic: true,
      metadata: { group: 'authentication', order: 2 },
    },
    
    // Notification settings
    {
      category: 'notifications',
      key: 'enable_email_notifications',
      value: true,
      type: 'boolean',
      description: 'Enable email notifications',
      isPublic: true,
      metadata: { group: 'email', order: 1 },
    },
    {
      category: 'notifications',
      key: 'smtp_host',
      value: '',
      type: 'string',
      description: 'SMTP server hostname',
      isPublic: false,
      metadata: { group: 'email', order: 2, sensitive: true },
    },
    {
      category: 'notifications',
      key: 'smtp_port',
      value: 587,
      type: 'number',
      description: 'SMTP server port',
      isPublic: false,
      validation: { min: 1, max: 65535 },
      metadata: { group: 'email', order: 3 },
    },
    
    // Backup settings
    {
      category: 'backup',
      key: 'enable_auto_backup',
      value: true,
      type: 'boolean',
      description: 'Enable automatic backups',
      isPublic: false,
      metadata: { group: 'schedule', order: 1 },
    },
    {
      category: 'backup',
      key: 'backup_frequency',
      value: 'daily',
      type: 'string',
      description: 'Backup frequency',
      isPublic: false,
      validation: { enum: ['hourly', 'daily', 'weekly', 'monthly'] },
      metadata: { group: 'schedule', order: 2 },
    },
    {
      category: 'backup',
      key: 'backup_retention_days',
      value: 30,
      type: 'number',
      description: 'Number of days to retain backups',
      isPublic: false,
      validation: { min: 1, max: 365 },
      metadata: { group: 'retention', order: 1 },
    },
  ];
  
  const results = [];
  
  for (const settingData of defaultSettings) {
    try {
      const existingSetting = await this.findOne({
        category: settingData.category,
        key: settingData.key,
      });
      
      if (!existingSetting) {
        const setting = new this({
          ...settingData,
          createdBy,
          updatedBy: createdBy,
        });
        
        await setting.save();
        results.push({ ...settingData, created: true });
      } else {
        results.push({ ...settingData, created: false, reason: 'Already exists' });
      }
    } catch (error) {
      results.push({
        ...settingData,
        created: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  return results;
};

// Create and export the model
export const Settings = mongoose.model<ISettings, ISettingsModel>('Settings', settingsSchema);
export default Settings;