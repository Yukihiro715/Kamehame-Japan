"use client";
import {usePortal} from "../shell";
import Dashboard from "./business-dashboard";
import {OpsOverview} from "./overview";
export function BusinessHome(){const {me}=usePortal();return me.roles?.some(r=>r==="ops_admin"||r==="ops_finance")?<Dashboard/>:<OpsOverview/>}
