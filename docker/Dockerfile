#
# SARA installation based on centos6 distrib
#
FROM centos:centos6
MAINTAINER The CentOS Project <cloud-ops@centos.org>

RUN yum -y update; yum clean all
RUN rpm -Uvh http://yum.postgresql.org/9.5/redhat/rhel-6-x86_64/pgdg-redhat95-9.5-2.noarch.rpm
RUN rpm -Uvh http://dl.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
RUN rpm -Uvh http://elgis.argeo.org/repos/6/elgis-release-6-6_0.noarch.rpm
RUN yum -y install git wget unzip nginx postgresql95-server postgresql95 postgresql95-contrib postgis2_95 postgis2_95-utils postgis2_95-client php php-pgsql php-xml php-fpm python-pip; yum clean all
RUN pip install requests

CMD ["/bin/bash"]
