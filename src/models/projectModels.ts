// Project Request Models
export interface CreateProjectRequest {
  locator: string;
  name: string;
  id: string;
  copyAllAssociatedSettings: boolean;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  parentProjectId?: string;
}

export interface ProjectSearchRequest {
  searchType: 'id' | 'name' | 'locator';
  value: string;
}

// Project Response Models
export interface ProjectResponse {
  id: string;
  name: string;
  parentProjectId: string;
  virtual: boolean;
  href: string;
  webUrl: string;
  parentProject?: {
    id: string;
    name: string;
    description: string;
    href: string;
    webUrl: string;
  };
  buildTypes?: {
    count: number;
    buildType: any[];
  };
  templates?: {
    count: number;
    buildType: any[];
  };
  deploymentDashboards?: {
    count: number;
  };
  parameters?: {
    property: any[];
    count: number;
    href: string;
  };
  vcsRoots?: {
    count: number;
    href: string;
  };
  projectFeatures?: {
    count: number;
    href: string;
  };
  projects?: {
    count: number;
  };
}

export interface ProjectsListResponse {
  project: ProjectResponse[];
  count: number;
}

// Project Model Classes
export class CreateProjectRequestModel implements CreateProjectRequest {
  constructor(
    public locator: string,
    public name: string,
    public id: string,
    public copyAllAssociatedSettings: boolean
  ) {}

  static fromObject(
    obj: Partial<CreateProjectRequest>
  ): CreateProjectRequestModel {
    return new CreateProjectRequestModel(
      obj.locator || '',
      obj.name || '',
      obj.id || '',
      obj.copyAllAssociatedSettings ?? false
    );
  }

  toJSON(): CreateProjectRequest {
    return {
      locator: this.locator,
      name: this.name,
      id: this.id,
      copyAllAssociatedSettings: this.copyAllAssociatedSettings,
    };
  }
}

export class ProjectResponseModel implements ProjectResponse {
  constructor(
    public id: string,
    public name: string,
    public parentProjectId: string,
    public virtual: boolean,
    public href: string,
    public webUrl: string,
    public parentProject?: ProjectResponse['parentProject'],
    public buildTypes?: ProjectResponse['buildTypes'],
    public templates?: ProjectResponse['templates'],
    public deploymentDashboards?: ProjectResponse['deploymentDashboards'],
    public parameters?: ProjectResponse['parameters'],
    public vcsRoots?: ProjectResponse['vcsRoots'],
    public projectFeatures?: ProjectResponse['projectFeatures'],
    public projects?: ProjectResponse['projects']
  ) {}

  static fromObject(obj: any): ProjectResponseModel {
    return new ProjectResponseModel(
      obj.id || '',
      obj.name || '',
      obj.parentProjectId || '',
      obj.virtual ?? false,
      obj.href || '',
      obj.webUrl || '',
      obj.parentProject,
      obj.buildTypes,
      obj.templates,
      obj.deploymentDashboards,
      obj.parameters,
      obj.vcsRoots,
      obj.projectFeatures,
      obj.projects
    );
  }

  toJSON(): ProjectResponse {
    return {
      id: this.id,
      name: this.name,
      parentProjectId: this.parentProjectId,
      virtual: this.virtual,
      href: this.href,
      webUrl: this.webUrl,
      parentProject: this.parentProject,
      buildTypes: this.buildTypes,
      templates: this.templates,
      deploymentDashboards: this.deploymentDashboards,
      parameters: this.parameters,
      vcsRoots: this.vcsRoots,
      projectFeatures: this.projectFeatures,
      projects: this.projects,
    };
  }
}
