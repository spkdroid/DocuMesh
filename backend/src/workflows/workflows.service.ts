import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThanOrEqual } from 'typeorm';
import { WorkflowDefinition } from './entities/workflow-definition.entity';
import { WorkflowInstance } from './entities/workflow-instance.entity';
import { ReviewTask, ReviewTaskStatus } from './entities/review-task.entity';
import { ReviewComment } from './entities/review-comment.entity';
import { AuditEntry, AuditAction } from './entities/audit-entry.entity';
import { Notification, NotificationType } from './entities/notification.entity';
import {
  CreateWorkflowDefinitionDto,
  StartWorkflowDto,
  TransitionWorkflowDto,
  CreateReviewTaskDto,
  UpdateReviewTaskDto,
  CreateReviewCommentDto,
} from './dto/workflows.dto';

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectRepository(WorkflowDefinition)
    private readonly defRepo: Repository<WorkflowDefinition>,
    @InjectRepository(WorkflowInstance)
    private readonly instanceRepo: Repository<WorkflowInstance>,
    @InjectRepository(ReviewTask)
    private readonly taskRepo: Repository<ReviewTask>,
    @InjectRepository(ReviewComment)
    private readonly commentRepo: Repository<ReviewComment>,
    @InjectRepository(AuditEntry)
    private readonly auditRepo: Repository<AuditEntry>,
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
  ) {}

  // === Workflow Definitions ===
  async createDefinition(orgId: string, dto: CreateWorkflowDefinitionDto) {
    const def = this.defRepo.create({
      organizationId: orgId,
      name: dto.name,
      description: dto.description || '',
      states: dto.states,
      transitions: dto.transitions,
      initialState: dto.initialState || 'draft',
    });
    return this.defRepo.save(def);
  }

  async seedBuiltInWorkflows(orgId: string) {
    const exists = await this.defRepo.findOne({
      where: { organizationId: orgId, isDefault: true },
    });
    if (exists) return exists;

    const standard = this.defRepo.create({
      organizationId: orgId,
      name: 'Standard Review',
      description: 'Draft → Review → Approved → Published',
      isDefault: true,
      initialState: 'draft',
      states: [
        { name: 'draft' },
        { name: 'review' },
        { name: 'approved' },
        { name: 'published', isFinal: true },
      ],
      transitions: [
        { from: 'draft', to: 'review', requiredRole: 'author' },
        { from: 'review', to: 'approved', requiredRole: 'reviewer', requiresApproval: true },
        { from: 'review', to: 'draft', requiredRole: 'reviewer' },
        { from: 'approved', to: 'published', requiredRole: 'admin' },
      ],
    });
    return this.defRepo.save(standard);
  }

  async findAllDefinitions(orgId: string) {
    return this.defRepo.find({
      where: { organizationId: orgId },
      order: { name: 'ASC' },
    });
  }

  async findDefinition(orgId: string, id: string) {
    const d = await this.defRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!d) throw new NotFoundException('Workflow definition not found');
    return d;
  }

  // === Workflow Instances ===
  async startWorkflow(orgId: string, userId: string, dto: StartWorkflowDto) {
    const def = await this.findDefinition(orgId, dto.workflowDefinitionId);

    const instance = this.instanceRepo.create({
      organizationId: orgId,
      workflowDefinitionId: def.id,
      contentItemId: dto.contentItemId,
      currentState: def.initialState,
      startedBy: userId,
    });
    const saved = await this.instanceRepo.save(instance);

    await this.createAudit(orgId, userId, 'workflow_instance', saved.id,
      AuditAction.CREATED, { state: def.initialState });

    return saved;
  }

  async transitionWorkflow(
    orgId: string,
    userId: string,
    instanceId: string,
    dto: TransitionWorkflowDto,
  ) {
    const instance = await this.instanceRepo.findOne({
      where: { id: instanceId, organizationId: orgId },
    });
    if (!instance) throw new NotFoundException('Workflow instance not found');
    if (instance.isComplete) throw new BadRequestException('Workflow already complete');

    const def = await this.findDefinition(orgId, instance.workflowDefinitionId);
    const transition = def.transitions.find(
      (t) => t.from === instance.currentState && t.to === dto.toState,
    );
    if (!transition) {
      throw new BadRequestException(
        `Invalid transition from "${instance.currentState}" to "${dto.toState}"`,
      );
    }

    // Check approval gate if required
    if (transition.requiresApproval) {
      const tasks = await this.taskRepo.find({
        where: {
          contentItemId: instance.contentItemId,
          workflowInstanceId: instance.id,
          organizationId: orgId,
        },
      });
      const allApproved = tasks.length > 0 &&
        tasks.every((t) => t.status === ReviewTaskStatus.APPROVED);
      if (!allApproved) {
        throw new BadRequestException('All review tasks must be approved before this transition');
      }
    }

    const fromState = instance.currentState;
    instance.currentState = dto.toState;

    const targetState = def.states.find((s) => s.name === dto.toState);
    if (targetState?.isFinal) instance.isComplete = true;

    await this.instanceRepo.save(instance);

    await this.createAudit(orgId, userId, 'workflow_instance', instance.id,
      AuditAction.WORKFLOW_TRANSITION, { comment: dto.comment }, fromState, dto.toState);

    return instance;
  }

  async findWorkflowInstance(orgId: string, id: string) {
    const i = await this.instanceRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!i) throw new NotFoundException('Workflow instance not found');
    return i;
  }

  async findWorkflowsByContent(orgId: string, contentItemId: string) {
    return this.instanceRepo.find({
      where: { organizationId: orgId, contentItemId },
      order: { createdAt: 'DESC' },
    });
  }

  // === Review Tasks ===
  async createReviewTask(orgId: string, userId: string, dto: CreateReviewTaskDto) {
    const task = this.taskRepo.create({
      organizationId: orgId,
      contentItemId: dto.contentItemId,
      assigneeId: dto.assigneeId,
      assignedBy: userId,
      instructions: dto.instructions || '',
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      workflowInstanceId: dto.workflowInstanceId || null,
    });
    const saved = await this.taskRepo.save(task);

    await this.createAudit(orgId, userId, 'review_task', saved.id,
      AuditAction.REVIEW_ASSIGNED, { assigneeId: dto.assigneeId });

    // Notify assignee
    await this.createNotification(orgId, dto.assigneeId,
      NotificationType.REVIEW_ASSIGNED,
      'New Review Assignment',
      `You have been assigned a review task`,
      'review_task', saved.id);

    return saved;
  }

  async updateReviewTask(orgId: string, userId: string, id: string, dto: UpdateReviewTaskDto) {
    const task = await this.taskRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!task) throw new NotFoundException('Review task not found');

    if (dto.status !== undefined) {
      task.status = dto.status;
      if (dto.status === ReviewTaskStatus.APPROVED ||
          dto.status === ReviewTaskStatus.REJECTED) {
        task.completedAt = new Date();
      }
    }
    if (dto.reviewNotes !== undefined) task.reviewNotes = dto.reviewNotes;

    const saved = await this.taskRepo.save(task);

    if (dto.status) {
      await this.createAudit(orgId, userId, 'review_task', id,
        AuditAction.REVIEW_COMPLETED, { status: dto.status });
    }

    return saved;
  }

  async findReviewTasksByAssignee(orgId: string, assigneeId: string) {
    return this.taskRepo.find({
      where: { organizationId: orgId, assigneeId },
      order: { createdAt: 'DESC' },
    });
  }

  async findReviewTasksByContent(orgId: string, contentItemId: string) {
    return this.taskRepo.find({
      where: { organizationId: orgId, contentItemId },
      order: { createdAt: 'DESC' },
    });
  }

  // Review Dashboard
  async getReviewDashboard(orgId: string, userId: string) {
    const pending = await this.taskRepo.count({
      where: { organizationId: orgId, assigneeId: userId, status: ReviewTaskStatus.PENDING },
    });
    const inReview = await this.taskRepo.count({
      where: { organizationId: orgId, assigneeId: userId, status: ReviewTaskStatus.IN_REVIEW },
    });
    const completed = await this.taskRepo.count({
      where: { organizationId: orgId, assigneeId: userId, status: In([ReviewTaskStatus.APPROVED, ReviewTaskStatus.REJECTED]) },
    });
    const overdue = await this.taskRepo.count({
      where: {
        organizationId: orgId,
        assigneeId: userId,
        status: In([ReviewTaskStatus.PENDING, ReviewTaskStatus.IN_REVIEW]),
        dueDate: LessThanOrEqual(new Date()),
      },
    });
    return { pending, inReview, completed, overdue };
  }

  // === Review Comments ===
  async createComment(orgId: string, userId: string, dto: CreateReviewCommentDto) {
    const comment = this.commentRepo.create({
      organizationId: orgId,
      contentItemId: dto.contentItemId,
      reviewTaskId: dto.reviewTaskId || null,
      authorId: userId,
      body: dto.body,
      textRange: dto.textRange || null,
      parentCommentId: dto.parentCommentId || null,
    });
    return this.commentRepo.save(comment);
  }

  async findCommentsByContent(orgId: string, contentItemId: string) {
    return this.commentRepo.find({
      where: { organizationId: orgId, contentItemId },
      order: { createdAt: 'ASC' },
    });
  }

  async resolveComment(orgId: string, id: string, resolved: boolean) {
    const c = await this.commentRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!c) throw new NotFoundException('Comment not found');
    c.resolved = resolved;
    return this.commentRepo.save(c);
  }

  // === Audit Trail ===
  async createAudit(
    orgId: string,
    userId: string,
    entityType: string,
    entityId: string,
    action: AuditAction,
    details: Record<string, unknown> = {},
    fromState?: string,
    toState?: string,
  ) {
    const entry = this.auditRepo.create({
      organizationId: orgId,
      userId,
      entityType,
      entityId,
      action,
      details,
      fromState: fromState || null,
      toState: toState || null,
    });
    return this.auditRepo.save(entry);
  }

  async getAuditTrail(orgId: string, entityType?: string, entityId?: string) {
    const where: Record<string, unknown> = { organizationId: orgId };
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    return this.auditRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  // === Notifications ===
  async createNotification(
    orgId: string,
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    entityType?: string,
    entityId?: string,
  ) {
    const notif = this.notifRepo.create({
      organizationId: orgId,
      userId,
      type,
      title,
      message,
      entityType: entityType || null,
      entityId: entityId || null,
    });
    return this.notifRepo.save(notif);
  }

  async getNotifications(orgId: string, userId: string, unreadOnly = false) {
    const where: Record<string, unknown> = { organizationId: orgId, userId };
    if (unreadOnly) where.read = false;
    return this.notifRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markNotificationRead(orgId: string, userId: string, id: string) {
    const n = await this.notifRepo.findOne({
      where: { id, organizationId: orgId, userId },
    });
    if (!n) throw new NotFoundException('Notification not found');
    n.read = true;
    return this.notifRepo.save(n);
  }

  async markAllNotificationsRead(orgId: string, userId: string) {
    await this.notifRepo.update(
      { organizationId: orgId, userId, read: false },
      { read: true },
    );
    return { success: true };
  }
}
