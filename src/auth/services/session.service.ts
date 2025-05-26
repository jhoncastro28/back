import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Session Service
 *
 * Implements a single session policy per user:
 * - Only one active session is allowed per user
 * - New logins automatically invalidate any existing session
 * - Maintains session audit trail in database
 */
@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly activeSessions: Map<string, string> = new Map();

  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Tracks a new user session, invalidating any existing session
   * @param userId - The ID of the user
   * @param token - The new session token
   */
  async trackSession(userId: string, token: string): Promise<void> {
    try {
      await this.invalidateAllUserSessions(userId);

      this.activeSessions.set(userId, token);

      await this.prismaService.userSession.create({
        data: {
          userId,
          token: token,
          loginTime: new Date(),
          userAgent: 'API Access',
          ipAddress: '0.0.0.0',
        },
      });

      this.logger.debug(`New session tracked for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error tracking session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Invalidates all sessions for a user
   * @param userId - The ID of the user
   */
  async invalidateAllUserSessions(userId: string): Promise<void> {
    try {
      this.activeSessions.delete(userId);

      await this.prismaService.userSession.updateMany({
        where: { userId, logoutTime: null },
        data: { logoutTime: new Date() },
      });

      this.logger.debug(`All sessions invalidated for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error invalidating all sessions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Invalidates a specific session
   * @param userId - The ID of the user
   * @param token - The session token to invalidate
   */
  async invalidateSession(userId: string, token: string): Promise<void> {
    try {
      if (this.activeSessions.get(userId) === token) {
        this.activeSessions.delete(userId);
      }

      await this.prismaService.userSession.updateMany({
        where: {
          userId,
          token: token,
          logoutTime: null,
        },
        data: { logoutTime: new Date() },
      });

      this.logger.debug(`Session invalidated for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error invalidating session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Checks if a session is active
   * @param userId - The ID of the user
   * @param token - The session token to check
   * @returns boolean indicating if the session is active
   */
  isSessionActive(userId: string, token: string): boolean {
    try {
      const activeToken = this.activeSessions.get(userId);
      const isActive = activeToken === token;
      this.logger.debug(`Session check - User: ${userId}, Active: ${isActive}`);
      return isActive;
    } catch (error) {
      this.logger.error(`Error checking session: ${error.message}`);
      return false;
    }
  }

  /**
   * Gets the number of active sessions for a user (will be 0 or 1)
   * @param userId - The ID of the user
   * @returns The number of active sessions
   */
  async getActiveSessions(userId: string): Promise<number> {
    return this.activeSessions.has(userId) ? 1 : 0;
  }

  /**
   * Cleans up expired sessions from the database
   * Keeps the audit trail for 30 days
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      await this.prismaService.userSession.deleteMany({
        where: {
          loginTime: {
            lt: thirtyDaysAgo,
          },
        },
      });

      this.logger.debug('Expired sessions cleaned up');
    } catch (error) {
      this.logger.error(`Error cleaning up sessions: ${error.message}`);
      throw error;
    }
  }
}
