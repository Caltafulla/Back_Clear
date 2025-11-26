import mongoose, { Schema, Document } from 'mongoose';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User, CreateUserRequest, UpdateUserRequest, UserRole } from '../../domain/entities/User';

interface IUserDocument extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: Object.values(UserRole), required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const UserModel = mongoose.model<IUserDocument>('User', UserSchema);

export class MongoUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const user = await UserModel.findById(id);
    return user ? this.mapToUser(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await UserModel.findOne({ email });
    return user ? this.mapToUser(user) : null;
  }

  async create(userData: CreateUserRequest): Promise<User> {
    const user = new UserModel({
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const savedUser = await user.save();
    return this.mapToUser(savedUser);
  }

  async update(id: string, userData: UpdateUserRequest): Promise<User | null> {
    const user = await UserModel.findByIdAndUpdate(
      id,
      { ...userData, updatedAt: new Date() },
      { new: true }
    );
    
    return user ? this.mapToUser(user) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(id);
    return !!result;
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<User[]> {
    const users = await UserModel.find()
      .limit(limit)
      .skip(offset)
      .sort({ createdAt: -1 });
    
    return users.map(user => this.mapToUser(user));
  }

  async findByRole(role: string): Promise<User[]> {
    const users = await UserModel.find({ role });
    return users.map(user => this.mapToUser(user));
  }

  private mapToUser(userDoc: IUserDocument): User {
    return {
      id: (userDoc._id as any).toString(),
      email: userDoc.email,
      password: userDoc.password,
      firstName: userDoc.firstName,
      lastName: userDoc.lastName,
      role: userDoc.role,
      isActive: userDoc.isActive,
      createdAt: userDoc.createdAt,
      updatedAt: userDoc.updatedAt
    };
  }
}

