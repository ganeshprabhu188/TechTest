<%@ WebHandler Language="C#" Class="LoadCSS" %>

//////////////////////////////////////////////////////////////////////////////////////////////////
// Bug id 				: TECH-34365
// Modified By			: Siva Sankar S
// Modified Date		: 18-June-2019
// Description			: Handling Segementation Name calling Twice .
//////////////////////////////////////////////////////////////////////////////////////////////////

using com.ramco.vw.config;
using System;
using System.Web;
using System.Web.SessionState;
using System.Security.Cryptography;
using System.Text;
using System.Diagnostics;
using System.IO;
using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using Newtonsoft.Json.Linq;
using Ramco.VW.RT.Web.Core;
using Ramco.VW.RT;
using System.Linq;
using System.Xml.Linq;
using System.Collections;
using Ramco.VW.RT.Communicator;
using Ramco.VW.RT.IClientCommunicator;

public class StatusObject
{	
	public string error
	{
		get;
		set;
	}

	public string status
	{
		get;
		set;
	}

	public StatusObject()
	{
		
	}
} 

public class LoadCSS : IHttpHandler, IRequiresSessionState
{
    public void ProcessRequest(HttpContext context)
    {
        JsonSerializerSettings settings = new JsonSerializerSettings();
		settings.NullValueHandling = NullValueHandling.Ignore; 
		StatusObject statusObject = new StatusObject();		
        String jsonString = String.Empty;				
		JObject page = null;
		bool hasError = false;
		bool hasTenentCss = false;
		string customerCss = String.Empty;
		String segmentName = "Ramco";
		ISessionManager oSessionManager = null;
		String settingsfilePath = String.Empty;
		String settingsContent = String.Empty;
		String cssfilePath = String.Empty;
		String fontFile = String.Empty;
		bool hasAvnCSS = false;
		
		try
        {						
			segmentName = GetSegmentationName();
			settingsfilePath = "../../settings.json";
			cssfilePath = "RamcoHub-all.css";
			fontFile = "FontFile.css";
			if (segmentName.ToLower() != "ramco")
				settingsfilePath = "../../" + segmentName + "_settings.json";			
			if (File.Exists(context.Server.MapPath(settingsfilePath))) {
				settingsContent = File.ReadAllText(context.Server.MapPath(settingsfilePath));
				page = JObject.Parse(settingsContent);
				try {
					hasTenentCss = ((bool)page.SelectToken("enableTenantCSS"));
				}
				catch (Exception pg){
				}	
				try {
					hasAvnCSS = ((bool)page.SelectToken("isExt2"));
				}
				catch (Exception ex){
					
				}	
				try {
					customerCss = ((string)page.SelectToken("customerTheme"));
				}
				catch (Exception cc){}
				
				if (hasAvnCSS) {
					cssfilePath = "RamcoHub-all-avn.css";
				}
				
				if (!string.IsNullOrEmpty(customerCss))
					cssfilePath = customerCss + "_" + cssfilePath;
				else if (hasTenentCss)
					cssfilePath = segmentName + "_" + cssfilePath;
			}
			if (File.Exists(context.Server.MapPath(cssfilePath))) {
				jsonString = File.ReadAllText(context.Server.MapPath(cssfilePath));
			}
        }
        catch (Exception e)
        {
			string eMsg = e.Message.ToString();
			statusObject.status = "Failed";
			statusObject.error = eMsg;
			jsonString = JsonConvert.SerializeObject(statusObject, Formatting.None, settings);
			hasError = true;			
        }
		if(!hasError) {
			//context.Response.Cache.SetExpires(DateTime.Now.AddSeconds(60));
			//context.Response.Cache.SetCacheability(HttpCacheability.Public);
			//context.Response.Cache.SetNoServerCaching();
			context.Response.Cache.SetMaxAge(new TimeSpan(360, 0, 0));
		}
		context.Response.ContentType = "text/css";
        context.Response.Write(jsonString);
    }	
    public bool IsReusable
    {
        get
        {
            return false;
        }
    }
	public static string GetSegmentationName()
	{
		string segmentationName = "Ramco";
		try
		{
			//SessionManager oSessionManager = new SessionManager();
			//oSessionManager.InitializeDeploymentationSegmentation();
			//segmentationName = oSessionManager.GetDeploymentSegmentationName();
			//TECH-34365
			ICommunicator clientCommunicator = new ClientCommunicator().GetClientCommunicator();
			CustomerDeploymentSegment deploymentSegment = clientCommunicator.GetDeploymentSegmentationAttributes(HttpContext.Current.Request.Url.Host);
			segmentationName = deploymentSegment.Segmentkey;
		
			if(String.IsNullOrEmpty(segmentationName))
				segmentationName = "Ramco";
		}
		catch (Exception e){
			segmentationName = "Ramco";
		}
		return segmentationName;
	}
}